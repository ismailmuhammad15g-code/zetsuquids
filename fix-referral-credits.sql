-- =============================================
-- FIX REFERRAL CREDITS - Run in Supabase SQL Editor
-- This script finds users who were referred but didn't get their bonus credits
-- =============================================

-- =============================================
-- STEP 1: View all users and their referral status
-- =============================================
SELECT
    zc.user_email,
    zc.credits,
    zc.referred_by,
    zc.referral_code,
    zc.total_referrals,
    zc.created_at,
    CASE
        WHEN zc.credits = 5 AND zc.referred_by IS NOT NULL THEN 'NEEDS_FIX - Should have 10'
        WHEN zc.credits >= 10 AND zc.referred_by IS NOT NULL THEN 'OK - Referred user'
        WHEN zc.referred_by IS NULL AND zc.credits = 5 THEN 'OK - Regular user'
        ELSE 'CHECK - Unknown state'
    END as status
FROM zetsuguide_credits zc
ORDER BY zc.created_at DESC;

-- =============================================
-- STEP 2: View referral records
-- =============================================
SELECT
    zr.*,
    zc.credits as referred_user_credits,
    zc.referred_by
FROM zetsuguide_referrals zr
LEFT JOIN zetsuguide_credits zc ON zc.user_email = zr.referred_email
ORDER BY zr.created_at DESC;

-- =============================================
-- STEP 3: FIX - Give bonus credits to referred users who only have 5
-- (They should have 10: 5 default + 5 referral bonus)
-- =============================================
UPDATE zetsuguide_credits
SET
    credits = 10,
    updated_at = NOW()
WHERE
    referred_by IS NOT NULL
    AND credits < 10;

-- =============================================
-- STEP 4: Verify the fix
-- =============================================
SELECT
    user_email,
    credits,
    referred_by,
    'FIXED' as status
FROM zetsuguide_credits
WHERE referred_by IS NOT NULL
ORDER BY updated_at DESC;

-- =============================================
-- STEP 5: Check if any referrer codes are missing
-- This happens when user shares link before visiting Pricing page
-- =============================================
SELECT
    u.email,
    u.name,
    zc.referral_code,
    CASE WHEN zc.referral_code IS NULL THEN 'MISSING - Needs code' ELSE 'HAS CODE' END as code_status
FROM users u
LEFT JOIN zetsuguide_credits zc ON zc.user_email = u.email
WHERE u.is_verified = true
ORDER BY u.created_at DESC;

-- =============================================
-- STEP 6: Generate missing referral codes for existing users
-- Run this to ensure everyone has a referral code
-- =============================================
INSERT INTO zetsuguide_credits (user_email, credits, referral_code, created_at)
SELECT
    u.email,
    5,
    UPPER(SUBSTRING(SPLIT_PART(u.email, '@', 1), 1, 4) || SUBSTRING(MD5(u.email || RANDOM()::text), 1, 4)),
    NOW()
FROM users u
WHERE u.is_verified = true
AND NOT EXISTS (
    SELECT 1 FROM zetsuguide_credits zc WHERE zc.user_email = u.email
)
ON CONFLICT (user_email) DO NOTHING;

-- =============================================
-- ALTERNATIVE: Manually fix a specific user
-- Replace 'user@example.com' with the actual email
-- =============================================
-- UPDATE zetsuguide_credits
-- SET credits = 10, updated_at = NOW()
-- WHERE user_email = 'user@example.com' AND referred_by IS NOT NULL;

-- =============================================
-- VIEW ALL CREDITS DATA (for debugging)
-- =============================================
SELECT * FROM zetsuguide_credits ORDER BY created_at DESC LIMIT 50;

-- =============================================
-- VIEW ALL REFERRALS (for debugging)
-- =============================================
SELECT * FROM zetsuguide_referrals ORDER BY created_at DESC LIMIT 50;
