-- IMMEDIATE FIX FOR SOLOMISMAILYT12
-- Run this query exactly as is

-- Step 1: Set total_referrals to 3 (since you invited 3 people)
UPDATE zetsuguide_credits
SET total_referrals = 3,
    credits = credits + 15,
    updated_at = NOW()
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

-- Step 2: Verify it worked
SELECT
    user_email,
    credits as total_credits,
    total_referrals as friends_invited,
    (total_referrals * 5) as bonus_from_referrals
FROM zetsuguide_credits
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

-- RESULT SHOULD SHOW:
-- total_credits: 34 (19 + 15)
-- friends_invited: 3
-- bonus_from_referrals: 15
