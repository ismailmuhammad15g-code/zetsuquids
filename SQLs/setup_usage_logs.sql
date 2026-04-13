-- =============================================
-- ZetsuGuide Usage Logs System
-- Run this in Supabase SQL Editor to enable history
-- =============================================

-- 1. Create Usage Logs Table
CREATE TABLE IF NOT EXISTS zetsuguide_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL, -- e.g., 'Chat', 'Publish Guide', 'AI Search'
  cost INTEGER DEFAULT 1,
  details TEXT, -- optional details like "Chat with AI about React"
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE zetsuguide_usage_logs ENABLE ROW LEVEL SECURITY;

-- 3. Create Policies
-- Allow users to see their own logs
DROP POLICY IF EXISTS "Users can view own logs" ON zetsuguide_usage_logs;
CREATE POLICY "Users can view own logs" ON zetsuguide_usage_logs
  FOR SELECT
  USING (auth.uid()::text = user_email OR user_email = current_user);

-- Allow users to insert their own logs (authenticity trusted for this phase)
DROP POLICY IF EXISTS "Users can insert own logs" ON zetsuguide_usage_logs;
CREATE POLICY "Users can insert own logs" ON zetsuguide_usage_logs
  FOR INSERT
  WITH CHECK (true);

-- 4. Index for performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_email ON zetsuguide_usage_logs (user_email);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON zetsuguide_usage_logs (created_at DESC);

-- 5. Insert some dummy data for testing (optional)
-- INSERT INTO zetsuguide_usage_logs (user_email, action, details) VALUES ('test@example.com', 'Welcome Bonus', 'Initial sign up credits');
