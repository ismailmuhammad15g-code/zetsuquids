-- ============================================================================
-- DATABASE MIGRATION: Workspace & Author System
-- Created: January 27, 2026
-- Purpose: Add author attribution and workspace features to guides table
-- ============================================================================

-- ============================================================================
-- SECTION 1: Add Author Fields to Guides Table
-- ============================================================================

-- Add author_name column (author's display name)
ALTER TABLE IF EXISTS guides
ADD COLUMN IF NOT EXISTS author_name VARCHAR(255);

-- Add author_id column (reference to auth.users.id)
ALTER TABLE IF EXISTS guides
ADD COLUMN IF NOT EXISTS author_id UUID;

-- Add comment for author_name column
COMMENT ON COLUMN guides.author_name IS 'Display name of the guide author';

-- Add comment for author_id column
COMMENT ON COLUMN guides.author_id IS 'Reference to the Supabase auth user ID';

-- ============================================================================
-- SECTION 2: Create Indexes for Performance
-- ============================================================================

-- Index on user_email for fast author lookups
CREATE INDEX IF NOT EXISTS idx_guides_author_email
ON guides(user_email);

-- Index on author_id for fast relationship queries
CREATE INDEX IF NOT EXISTS idx_guides_author_id
ON guides(author_id);

-- Index on created_at for ordering and filtering
CREATE INDEX IF NOT EXISTS idx_guides_created_at
ON guides(created_at DESC);

-- ============================================================================
-- SECTION 3: Add Table Comments
-- ============================================================================

-- Update guides table comment if needed
COMMENT ON TABLE guides IS 'User-generated guides and articles. Includes author information for attribution.';

-- ============================================================================
-- SECTION 4: Verify Column Existence (Safety Check)
-- ============================================================================

-- This query can be used to verify the migration was successful:
-- SELECT column_name, data_type, is_nullable
-- FROM information_schema.columns
-- WHERE table_name = 'guides'
-- AND column_name IN ('user_email', 'author_name', 'author_id')
-- ORDER BY ordinal_position;

-- ============================================================================
-- SECTION 5: Optional Data Updates (After Migration)
-- ============================================================================

-- Optional: Populate author_name from user_email if NULL
-- Run this after migration if you want to backfill existing guides
--
-- UPDATE guides
-- SET author_name = SPLIT_PART(user_email, '@', 1)
-- WHERE author_name IS NULL
-- AND user_email IS NOT NULL;
--
-- Optional: Check how many guides need backfill
-- SELECT COUNT(*) as guides_without_author_name
-- FROM guides
-- WHERE author_name IS NULL
-- AND user_email IS NOT NULL;

-- ============================================================================
-- SECTION 6: Rollback Instructions
-- ============================================================================

-- If you need to rollback this migration, run:
--
-- DROP INDEX IF EXISTS idx_guides_author_email;
-- DROP INDEX IF EXISTS idx_guides_author_id;
-- DROP INDEX IF EXISTS idx_guides_created_at;
--
-- ALTER TABLE guides
-- DROP COLUMN IF EXISTS author_name;
--
-- ALTER TABLE guides
-- DROP COLUMN IF EXISTS author_id;

-- ============================================================================
-- END OF MIGRATION
-- ============================================================================

-- Notes:
-- - This migration is safe to run multiple times (uses IF NOT EXISTS)
-- - New guides will have author_name and author_id populated
-- - Existing guides will have NULL values for new columns
-- - Data is backward compatible - app works with or without author info
-- - Indexes improve performance for author lookups and filtering
-- - To verify success, check information_schema.columns table
