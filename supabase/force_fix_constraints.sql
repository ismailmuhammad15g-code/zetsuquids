-- ULTIMATE FIX SCRIPT
-- This script safely removes restrictive constraints and adds "ON DELETE CASCADE"
-- It also fixes the referral counts.

BEGIN;

DO $$
DECLARE
    r RECORD;
BEGIN
    -------------------------------------------------------
    -- 1. FIX ZETHUGUIDE_CREDITS (The most likely culprit)
    -------------------------------------------------------
    -- Loop through any foreign key on 'zetsuguide_credits' that references 'auth.users'
    FOR r IN
        SELECT tc.constraint_name
        FROM information_schema.table_constraints AS tc 
        JOIN information_schema.key_column_usage AS kcu
          ON tc.constraint_name = kcu.constraint_name
          AND tc.table_schema = kcu.table_schema
        JOIN information_schema.constraint_column_usage AS ccu
          ON ccu.constraint_name = tc.constraint_name
          AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
          AND tc.table_name = 'zetsuguide_credits'
          AND ccu.table_name = 'users' 
          AND ccu.table_schema = 'auth'
    LOOP
        RAISE NOTICE 'Dropping constraint % on zetsuguide_credits', r.constraint_name;
        EXECUTE 'ALTER TABLE public.zetsuguide_credits DROP CONSTRAINT ' || quote_ident(r.constraint_name);
    END LOOP;

    -- Add the correct CASCADE constraint
    ALTER TABLE public.zetsuguide_credits
        ADD CONSTRAINT zetsuguide_credits_user_id_fkey
        FOREIGN KEY (user_id)
        REFERENCES auth.users(id)
        ON DELETE CASCADE;


    -------------------------------------------------------
    -- 2. FIX PROMPTS (Just in case)
    -------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'prompts') THEN
        -- Add user_id column if missing (for safety)
        -- (Assuming prompts might have user_id linked to auth.users)
        
        FOR r IN
            SELECT tc.constraint_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name = 'prompts'
              AND ccu.table_name = 'users' 
              AND ccu.table_schema = 'auth'
        LOOP
            RAISE NOTICE 'Dropping constraint % on prompts', r.constraint_name;
            EXECUTE 'ALTER TABLE public.prompts DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        END LOOP;

        -- We only add the FK back if user_id column actually exists
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'prompts' AND column_name = 'user_id') THEN
             ALTER TABLE public.prompts
                ADD CONSTRAINT prompts_user_id_fkey
                FOREIGN KEY (user_id)
                REFERENCES auth.users(id)
                ON DELETE CASCADE;
        END IF;
    END IF;

    -------------------------------------------------------
    -- 3. FIX GUIDES (Just in case)
    -------------------------------------------------------
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'guides') THEN
        FOR r IN
            SELECT tc.constraint_name
            FROM information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
            WHERE tc.constraint_type = 'FOREIGN KEY' 
              AND tc.table_name = 'guides'
              AND ccu.table_name = 'users' 
              AND ccu.table_schema = 'auth'
        LOOP
            RAISE NOTICE 'Dropping constraint % on guides', r.constraint_name;
            EXECUTE 'ALTER TABLE public.guides DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        END LOOP;

        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'guides' AND column_name = 'user_id') THEN
             ALTER TABLE public.guides
                ADD CONSTRAINT guides_user_id_fkey
                FOREIGN KEY (user_id)
                REFERENCES auth.users(id)
                ON DELETE CASCADE;
        END IF;
    END IF;

END $$;


-------------------------------------------------------
-- 4. RECALCULATE STATS (With Type Fix)
-------------------------------------------------------
CREATE OR REPLACE FUNCTION recalculate_referrals()
RETURNS void AS $$
BEGIN
    -- Update stats from actual data
    -- Using ::text casting to handle potential UUID vs Text mismatch safely
    UPDATE public.zetsuguide_credits referrer
    SET total_referrals = (
        SELECT COUNT(*)
        FROM public.zetsuguide_credits referent
        WHERE referent.referred_by IS NOT NULL 
          AND (referent.referred_by = referrer.user_id::text)
    ),
    credits = 5 + (
        SELECT COUNT(*)
        FROM public.zetsuguide_credits referent
        WHERE referent.referred_by IS NOT NULL 
          AND (referent.referred_by = referrer.user_id::text)
    ) * 5;
    
    RAISE NOTICE 'Referrals recalculated.';
END;
$$ LANGUAGE plpgsql;

-- Execute calculation
SELECT recalculate_referrals();

COMMIT;
