-- DIAGNOSTIC: Check what referral records exist
SELECT
    referrer_email,
    referred_email,
    created_at
FROM zetsuguide_referrals
WHERE LOWER(referrer_email) LIKE '%solomismailyt%'
   OR LOWER(referred_email) LIKE '%solomismailyt%'
ORDER BY created_at DESC;

-- Check all referral records to see what's in the table
SELECT * FROM zetsuguide_referrals ORDER BY created_at DESC LIMIT 20;

-- ============================================================================
-- DIRECT FIX FOR YOUR ACCOUNT
-- ============================================================================

-- 1. Count how many people actually used your referral code
SELECT
    referral_code,
    COUNT(*) as actual_referrals
FROM zetsuguide_credits
WHERE LOWER(referred_by) = 'solomismailyt12@gmail.com'
GROUP BY referral_code;

-- 2. If you have 3 referrals, update your total_referrals count
UPDATE zetsuguide_credits
SET total_referrals = 3,
    updated_at = NOW()
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

-- 3. Add the 15 credit bonus (3 × 5) to your account
UPDATE zetsuguide_credits
SET credits = credits + 15,
    updated_at = NOW()
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

-- 4. Verify the fix
SELECT
    user_email,
    credits,
    total_referrals,
    (total_referrals * 5) as should_earn_from_referrals
FROM zetsuguide_credits
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

-- 5. Check who referred people to you
SELECT
    user_email,
    referred_by
FROM zetsuguide_credits
WHERE LOWER(referred_by) = 'solomismailyt12@gmail.com';
