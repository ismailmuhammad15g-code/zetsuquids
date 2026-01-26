-- FIX ALL FOREIGN KEYS SCRIPT
-- This script dynamically finds ALL tables referencing auth.users and fixes them to allow deletion.

BEGIN;

DO $$
DECLARE
    r RECORD;
    cmd TEXT;
BEGIN
    -- Loop through every foreign key in the 'public' schema that points to 'auth.users'
    FOR r IN
        SELECT
            tc.table_schema, 
            tc.table_name, 
            tc.constraint_name,
            kcu.column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE tc.constraint_type = 'FOREIGN KEY' 
            AND tc.table_schema = 'public'
            AND ccu.table_schema = 'auth'
            AND ccu.table_name = 'users'
    LOOP
        -- Construct the SQL to fix this specific constraint
        RAISE NOTICE 'Fixing constraint: % on table %.%', r.constraint_name, r.table_schema, r.table_name;
        
        -- 1. Drop the strict constraint
        cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) 
            || ' DROP CONSTRAINT ' || quote_ident(r.constraint_name);
        EXECUTE cmd;
        
        -- 2. Re-add it with ON DELETE CASCADE
        -- We re-use the original name and column
        cmd := 'ALTER TABLE ' || quote_ident(r.table_schema) || '.' || quote_ident(r.table_name) 
            || ' ADD CONSTRAINT ' || quote_ident(r.constraint_name)
            || ' FOREIGN KEY (' || quote_ident(r.column_name) || ')'
            || ' REFERENCES auth.users(id) ON DELETE CASCADE';
        EXECUTE cmd;
        
    END LOOP;
END $$;

-- Also verify the referral stats recalculation (Corrected logic)
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
