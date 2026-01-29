-- RECOVER CREDITS AND REFERRALS - COMPLETE FIX FOR ALL USERS
-- Run this in Supabase SQL Editor
-- This script fixes all users' credits and referrals automatically

BEGIN;

-- Step 1: Check all users current status before fix
SELECT
    user_email,
    credits,
    total_referrals,
    referred_by,
    created_at,
    updated_at
FROM zetsuguide_credits
ORDER BY created_at DESC;

-- Step 2: Fix total_referrals for ALL users by counting their actual referred users
UPDATE zetsuguide_credits
SET total_referrals = (
    SELECT COUNT(*)
    FROM zetsuguide_credits z2
    WHERE z2.referred_by = zetsuguide_credits.user_email
),
updated_at = NOW()
WHERE 1=1;

-- Step 3: Restore default credits (5) for users with 0 credits
UPDATE zetsuguide_credits
SET
    credits = CASE
        WHEN credits <= 0 THEN 5
        ELSE credits
    END,
    updated_at = NOW()
WHERE credits <= 0;

-- Step 4: Ensure all users have proper referral bonus credits
-- Add 5 credits for each referral made (if not already counted)
UPDATE zetsuguide_credits
SET
    credits = credits + (
        SELECT COUNT(*) * 5
        FROM zetsuguide_credits z2
        WHERE z2.referred_by = zetsuguide_credits.user_email
    ) - (
        SELECT COALESCE(
            (total_referrals * 5), 0
        )
        FROM zetsuguide_credits z3
        WHERE z3.user_email = zetsuguide_credits.user_email
    ),
    updated_at = NOW()
WHERE 1=1;

-- Step 5: Verify the fix for all users
SELECT
    user_email,
    credits,
    total_referrals,
    referred_by,
    (total_referrals * 5) as referral_earnings,
    (credits + (total_referrals * 5)) as total_available,
    updated_at
FROM zetsuguide_credits
ORDER BY credits DESC;

-- Step 6: Summary statistics
SELECT
    'Total Users' as metric,
    COUNT(*) as value
FROM zetsuguide_credits
UNION ALL
SELECT 'Total Credits in System', SUM(credits) FROM zetsuguide_credits
UNION ALL
SELECT 'Users with 0 Credits', COUNT(*) FROM zetsuguide_credits WHERE credits = 0
UNION ALL
SELECT 'Average Credits per User', AVG(credits) FROM zetsuguide_credits
UNION ALL
SELECT 'Users with Referrals', COUNT(*) FROM zetsuguide_credits WHERE total_referrals > 0;

COMMIT;
