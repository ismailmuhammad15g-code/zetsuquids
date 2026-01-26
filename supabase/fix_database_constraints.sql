-- MASTER FIX SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR TO FIX EVERYTHING

BEGIN;

-- 1. FIX DELETION ERROR: Drop existing constraint if it exists and re-add with CASCADE
-- This ensures that when you delete a user in Auth, their credits row is also deleted automatically.
DO $$
BEGIN
    -- Try to drop the constraint if we can guess its name, or just drop the column's dependency
    -- Common name pattern: table_column_fkey
    IF EXISTS (SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = 'zetsuguide_credits_user_id_fkey') THEN
        ALTER TABLE public.zetsuguide_credits DROP CONSTRAINT zetsuguide_credits_user_id_fkey;
    END IF;
END $$;

-- Re-establish the foreign key with ON DELETE CASCADE
ALTER TABLE public.zetsuguide_credits
    ADD CONSTRAINT zetsuguide_credits_user_id_fkey
    FOREIGN KEY (user_id)
    REFERENCES auth.users(id)
    ON DELETE CASCADE;


-- 2. FIX TYPE MISMATCH & RECALCULATE STATS
-- We cast user_id to text purely for the comparison if your referred_by column is text.
-- If referred_by is UUID, you can remove ::text, but ::text is safer if unsure.

CREATE OR REPLACE FUNCTION recalculate_referrals()
RETURNS void AS $$
BEGIN
    -- Recalculate based on actual existing rows
    UPDATE public.zetsuguide_credits referrer
    SET total_referrals = (
        SELECT COUNT(*)
        FROM public.zetsuguide_credits referent
        WHERE referent.referred_by = referrer.user_id::text
           OR referent.referred_by = referrer.user_id::uuid::text -- Covers both cases just to be safe
    ),
    credits = 5 + (
        SELECT COUNT(*)
        FROM public.zetsuguide_credits referent
        WHERE referent.referred_by = referrer.user_id::text
           OR referent.referred_by = referrer.user_id::uuid::text
    ) * 5;
    
    RAISE NOTICE 'Referrals recalculated.';
END;
$$ LANGUAGE plpgsql;

-- Run the recalculation
SELECT recalculate_referrals();

COMMIT;
