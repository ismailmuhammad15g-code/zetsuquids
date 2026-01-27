-- Check your referral data directly
SELECT
    user_email,
    credits,
    total_referrals,
    referred_by,
    (total_referrals * 5) as referral_earnings
FROM zetsuguide_credits
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

-- If total_referrals is still 0, this will show you how many people are referred by you
SELECT
    user_email,
    referred_by
FROM zetsuguide_credits
WHERE LOWER(referred_by) = 'solomismailyt12@gmail.com';

-- Count how many referrals you have
SELECT COUNT(*) as total_people_you_referred
FROM zetsuguide_credits
WHERE LOWER(referred_by) = 'solomismailyt12@gmail.com';
