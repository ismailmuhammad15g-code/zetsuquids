-- =============================================
-- FIX CREDITS NOW - Run this in Supabase SQL Editor
-- This will give everyone at least 5 credits
-- =============================================

-- STEP 1: Update all users to have at least 5 credits
UPDATE zetsuguide_credits
SET
    credits = 5,
    updated_at = NOW()
WHERE credits < 5;

-- STEP 2: Verify the fix - should show everyone with 5+ credits
SELECT
    user_email,
    credits,
    'FIXED' as status
FROM zetsuguide_credits
ORDER BY created_at DESC;
