-- ==============================================================================
-- GUIDE VIEWS TRACKING SYSTEM
-- ==============================================================================
-- Security Features:
-- 🔒 Prevents authors from viewing their own guides
-- 🔒 One view per user/session per guide per day (24h cooldown)
-- 🔒 Separate tracking for authenticated users vs anonymous sessions
-- 🔒 RLS policies to enforce security at database level
-- ==============================================================================

-- Create guide_views table to track guide views
CREATE TABLE IF NOT EXISTS guide_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id INTEGER NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT, -- For tracking anonymous users
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create IMMUTABLE function to convert timestamp to date (required for indexes)
CREATE OR REPLACE FUNCTION timestamp_to_date(ts TIMESTAMP WITH TIME ZONE)
RETURNS DATE AS $$
BEGIN
  RETURN (ts AT TIME ZONE 'UTC')::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Clean up duplicate views before creating unique indexes
-- Keep only the earliest view for each user/guide/day combination
DELETE FROM guide_views
WHERE id NOT IN (
  SELECT DISTINCT ON (guide_id, user_id, timestamp_to_date(created_at))
    id
  FROM guide_views
  WHERE user_id IS NOT NULL
  ORDER BY guide_id, user_id, timestamp_to_date(created_at), created_at ASC
);

-- Clean up duplicate views for anonymous sessions
DELETE FROM guide_views
WHERE id NOT IN (
  SELECT DISTINCT ON (guide_id, session_id, timestamp_to_date(created_at))
    id
  FROM guide_views
  WHERE session_id IS NOT NULL AND user_id IS NULL
  ORDER BY guide_id, session_id, timestamp_to_date(created_at), created_at ASC
);

-- Create unique index to prevent duplicate views (one view per user/session per guide per day)
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_view_user_guide
  ON guide_views(guide_id, user_id, timestamp_to_date(created_at))
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_view_session_guide
  ON guide_views(guide_id, session_id, timestamp_to_date(created_at))
  WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_guide_views_guide_id ON guide_views(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_views_created_at ON guide_views(created_at);
CREATE INDEX IF NOT EXISTS idx_guide_views_user_id ON guide_views(user_id);

-- Add views_count column to guides table (denormalized for performance)
ALTER TABLE guides ADD COLUMN IF NOT EXISTS views_count INTEGER DEFAULT 0;

-- Create function to increment views count
CREATE OR REPLACE FUNCTION increment_guide_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE guides
  SET views_count = views_count + 1
  WHERE id = NEW.guide_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger to auto-increment views_count
DROP TRIGGER IF EXISTS trigger_increment_guide_views ON guide_views;
CREATE TRIGGER trigger_increment_guide_views
  AFTER INSERT ON guide_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_guide_views();

-- Enable RLS
ALTER TABLE guide_views ENABLE ROW LEVEL SECURITY;

-- 🔒 SECURITY: Function to check if user is NOT the author
CREATE OR REPLACE FUNCTION is_not_guide_author(p_guide_id INTEGER, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  -- If no user_id, allow (anonymous users can view)
  IF p_user_id IS NULL THEN
    RETURN TRUE;
  END IF;

  -- Check if user is the author
  RETURN NOT EXISTS (
    SELECT 1 FROM guides
    WHERE id = p_guide_id
    AND author_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policy: Only non-authors can insert views (prevent author self-viewing)
DROP POLICY IF EXISTS "Anyone can insert views" ON guide_views;
CREATE POLICY "Non-authors can insert views"
  ON guide_views
  FOR INSERT
  WITH CHECK (is_not_guide_author(guide_id, user_id));

-- Policy: Users can view all views (for analytics)
DROP POLICY IF EXISTS "Anyone can view views" ON guide_views;
CREATE POLICY "Anyone can view views"
  ON guide_views
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT ALL ON guide_views TO authenticated;
GRANT ALL ON guide_views TO anon;
