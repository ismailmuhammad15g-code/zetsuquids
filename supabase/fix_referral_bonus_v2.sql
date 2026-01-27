-- DIAGNOSTIC QUERIES TO CHECK STATUS
-- Run these first to see what's happening

-- 1. Check your current credits and referrals
SELECT
    user_email,
    credits,
    total_referrals,
    referred_by
FROM zetsuguide_credits
WHERE LOWER(user_email) LIKE '%solomismailyt12%'
OR LOWER(user_email) LIKE '%pomajes860%';

-- 2. Check all referral records
SELECT * FROM zetsuguide_referrals;

-- 3. Check what's in the referral notifications table
SELECT * FROM referral_notifications LIMIT 10;

-- ============================================================================
-- ACTUAL FIX QUERIES
-- ============================================================================

-- 4. Ensure all emails are lowercase for consistency
UPDATE zetsuguide_credits
SET user_email = LOWER(user_email);

UPDATE zetsuguide_credits
SET referred_by = LOWER(referred_by);

UPDATE zetsuguide_referrals
SET referrer_email = LOWER(referrer_email),
    referred_email = LOWER(referred_email);

-- 5. Calculate total referrals and bonus credits directly from referral records
-- For each referrer, count how many people they referred
UPDATE zetsuguide_credits c
SET total_referrals = (
    SELECT COUNT(*)
    FROM zetsuguide_referrals r
    WHERE LOWER(r.referrer_email) = LOWER(c.user_email)
);

-- 6. Add the bonus credits (5 per referral)
-- This is the key fix - directly setting credits to include the referral bonus
UPDATE zetsuguide_credits c
SET credits = COALESCE(credits, 0) + (
    (SELECT COUNT(*) FROM zetsuguide_referrals r
     WHERE LOWER(r.referrer_email) = LOWER(c.user_email)) * 5
)
WHERE (
    SELECT COUNT(*) FROM zetsuguide_referrals r
    WHERE LOWER(r.referrer_email) = LOWER(c.user_email)
) > 0;

-- 7. Verify the fix worked - run this to check your new credits
SELECT
    user_email,
    credits,
    total_referrals,
    (total_referrals * 5) as bonus_received
FROM zetsuguide_credits
WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';

-- 8. If needed, manually set your bonus (run only if above didn't work)
-- UPDATE zetsuguide_credits
-- SET credits = credits + 15
-- WHERE LOWER(user_email) = 'solomismailyt12@gmail.com';
