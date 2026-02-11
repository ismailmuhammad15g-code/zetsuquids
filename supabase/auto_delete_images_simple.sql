-- =====================================================
-- SIMPLE AUTO-DELETE FOR OLD IMAGE URLs (24 HOURS)
-- =====================================================
-- This is a simpler alternative that doesn't require pg_cron
-- It uses a trigger to clean old images whenever new ones are added
-- =====================================================

-- Step 1: Add image_url column if not exists
ALTER TABLE support_messages
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Step 2: Create function to auto-delete old image URLs
CREATE OR REPLACE FUNCTION auto_delete_old_images()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- When a new message with image is inserted, clean old ones
    IF NEW.image_url IS NOT NULL THEN
        -- Delete image URLs older than 24 hours
        UPDATE support_messages
        SET image_url = NULL
        WHERE image_url IS NOT NULL
          AND created_at < NOW() - INTERVAL '24 hours';
    END IF;

    RETURN NEW;
END;
$$;

-- Step 3: Create trigger that runs on INSERT
DROP TRIGGER IF EXISTS trigger_auto_delete_old_images ON support_messages;
CREATE TRIGGER trigger_auto_delete_old_images
    AFTER INSERT ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_delete_old_images();

-- Step 4: Create manual cleanup function (run anytime)
CREATE OR REPLACE FUNCTION cleanup_old_image_urls()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        UPDATE support_messages
        SET image_url = NULL
        WHERE image_url IS NOT NULL
          AND created_at < NOW() - INTERVAL '24 hours'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;

    RETURN deleted_count;
END;
$$;

-- =====================================================
-- HOW IT WORKS:
-- =====================================================
-- 1. Every time someone uploads an image, the trigger runs
-- 2. The trigger automatically deletes image URLs older than 24h
-- 3. This keeps your DB clean without needing cron jobs
-- 4. You can also manually run: SELECT cleanup_old_image_urls();
-- =====================================================

-- Manual cleanup (optional - run now to clean existing old images)
SELECT cleanup_old_image_urls() as deleted_count;

-- =====================================================
-- VERIFY IT WORKS:
-- =====================================================
-- Check messages with images:
-- SELECT id, message, image_url, created_at
-- FROM support_messages
-- WHERE image_url IS NOT NULL
-- ORDER BY created_at DESC;
-- =====================================================
