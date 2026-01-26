-- SIMPLE FIX SCRIPT
-- This script directly drops the specific constraint causing issues and re-adds it correctly.

BEGIN;

-- 1. FIX DELETION ERROR
-- Explicitly drop the constraint by name. If it doesn't exist, this does nothing (no error).
ALTER TABLE public.zetsuguide_credits 
    DROP CONSTRAINT IF EXISTS zetsuguide_credits_user_id_fkey;

-- Re-add the constraint with CASCADE allowed
ALTER TABLE public.zetsuguide_credits
    ADD CONSTRAINT zetsuguide_credits_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;


-- 2. FIX STATS (Recalculate)
CREATE OR REPLACE FUNCTION recalculate_referrals()
RETURNS void AS $$
BEGIN
    UPDATE public.zetsuguide_credits referrer
    SET total_referrals = (
        SELECT COUNT(*)
        FROM public.zetsuguide_credits referent
        WHERE referent.referred_by = referrer.user_id::text
    ),
    credits = 5 + (
        SELECT COUNT(*)
        FROM public.zetsuguide_credits referent
        WHERE referent.referred_by = referrer.user_id::text
    ) * 5;
END;
$$ LANGUAGE plpgsql;

SELECT recalculate_referrals();

COMMIT;
