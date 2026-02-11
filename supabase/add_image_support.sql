-- =====================================================
-- IMAGE SUPPORT WITH AUTO-DELETE AFTER 24 HOURS
-- =====================================================
-- This migration adds image support to support_messages
-- and automatically deletes image URLs after 24 hours
-- to save space and maintain privacy
-- =====================================================

-- Step 1: Add image_url column
ALTER TABLE support_messages
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 2: Add index for faster queries
CREATE INDEX IF NOT EXISTS idx_support_messages_image
ON support_messages(image_url)
WHERE image_url IS NOT NULL;

-- Step 3: Create function to delete old image URLs (24 hours)
CREATE OR REPLACE FUNCTION delete_old_image_urls()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Clear image_url for messages older than 24 hours
    UPDATE support_messages
    SET image_url = NULL
    WHERE image_url IS NOT NULL
      AND created_at < NOW() - INTERVAL '24 hours';

    RAISE NOTICE 'Deleted image URLs older than 24 hours';
END;
$$;

-- Step 4: Enable pg_cron extension (if not already enabled)
CREATE EXTENSION IF NOT EXISTS pg_cron;

-- Step 5: Schedule auto-deletion every hour
-- This runs every hour and cleans up old image URLs
SELECT cron.schedule(
    'delete-old-support-images',     -- Job name
    '0 * * * *',                     -- Cron schedule (every hour at minute 0)
    $$SELECT delete_old_image_urls();$$
);

-- Step 6: Grant necessary permissions
GRANT EXECUTE ON FUNCTION delete_old_image_urls() TO postgres;
GRANT EXECUTE ON FUNCTION delete_old_image_urls() TO service_role;

-- =====================================================
-- MANUAL CLEANUP (run if needed)
-- =====================================================
-- To manually delete old image URLs, run:
-- SELECT delete_old_image_urls();

-- To check scheduled jobs:
-- SELECT * FROM cron.job;

-- To remove the scheduled job:
-- SELECT cron.unschedule('delete-old-support-images');

-- =====================================================
-- NOTES:
-- =====================================================
-- 1. Images are stored on ImgBB (external, free)
-- 2. Only the URL is saved in Supabase
-- 3. After 24 hours, the URL is automatically deleted from DB
-- 4. This keeps your database clean and respects user privacy
-- 5. The actual image on ImgBB remains (ImgBB keeps them forever)
-- =====================================================
