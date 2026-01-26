-- Recalculate Referral Counts
-- Run this script in your Supabase SQL Editor to fix any discrepancies in referral stats.

-- 1. Create a function to recalculate referrals for all users
CREATE OR REPLACE FUNCTION recalculate_referrals()
RETURNS void AS $$
BEGIN
    -- Update total_referrals based on the actual count of rows where referred_by = user_id
    UPDATE public.zetsuguide_credits referrer
    SET total_referrals = (
        SELECT COUNT(*)
        FROM public.zetsuguide_credits referent
        WHERE referent.referred_by = referrer.user_id::text
    ),
    -- Optional: Recalculate credits if you want them to strictly match referrals (e.g. 5 per referral + 5 base)
    credits = 5 + (
        SELECT COUNT(*)
        FROM public.zetsuguide_credits referent
        WHERE referent.referred_by = referrer.user_id::text
    ) * 5;
    
    RAISE NOTICE 'Referral counts recalculated successfully.';
END;
$$ LANGUAGE plpgsql;

-- 2. Execute the function immediately
SELECT recalculate_referrals();

-- 3. (Optional) Manual check for a specific user (Replace YOUR_USER_ID)
-- SELECT * FROM zetsuguide_credits WHERE user_id = 'YOUR_USER_ID';
