-- RECOVER CREDITS AND REFERRALS - COMPLETE FIX
-- Run this in Supabase SQL Editor

BEGIN;

-- Step 1: Check your current status
SELECT
    user_email,
    credits,
    total_referrals,
    referred_by,
    created_at,
    updated_at
FROM zetsuguide_credits
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

-- Step 2: Count actual referrals you should have
SELECT COUNT(*) as actual_referral_count
FROM zetsuguide_credits
WHERE LOWER(referred_by) = 'solomismailyt12@gmail.com';

-- Step 3: Fix total_referrals by counting actual referred users
UPDATE zetsuguide_credits
SET total_referrals = (
    SELECT COUNT(*)
    FROM zetsuguide_credits z2
    WHERE z2.referred_by = zetsuguide_credits.user_email
)
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

-- Step 4: Manually restore your credits to correct amount
-- Change the number 40 below to your actual credit balance
UPDATE zetsuguide_credits
SET
    credits = 40,
    updated_at = NOW()
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

-- Step 5: Verify the fix
SELECT
    user_email,
    credits,
    total_referrals,
    referred_by,
    (total_referrals * 5) as referral_earnings
FROM zetsuguide_credits
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

COMMIT;
