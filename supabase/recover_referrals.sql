-- RECOVER MISSING REFERRALS (SAFE VERSION)
-- This script manually checks for existence to avoid constraint errors.

BEGIN;

DO $$
DECLARE
    pending_user RECORD;
    referrer_record RECORD;
    pending_code TEXT;
    existing_credit_id BIGINT;
BEGIN
    -- Loop through all users who have a 'referral_pending' tag in their metadata
    FOR pending_user IN
        SELECT u.id, u.email, u.raw_user_meta_data->>'referral_pending' as code
        FROM auth.users u
        WHERE u.raw_user_meta_data->>'referral_pending' IS NOT NULL
    LOOP
        pending_code := pending_user.code;
        
        -- Find who owns this code
        SELECT * INTO referrer_record 
        FROM public.zetsuguide_credits 
        WHERE referral_code = pending_code
        LIMIT 1;
        
        IF FOUND THEN
            -- Check if this user already has a credits row
            SELECT id INTO existing_credit_id
            FROM public.zetsuguide_credits
            WHERE user_id = pending_user.id
            LIMIT 1;

            IF existing_credit_id IS NOT NULL THEN
                -- Row exists: Check if referred_by is empty
                IF EXISTS (
                    SELECT 1 FROM public.zetsuguide_credits 
                    WHERE id = existing_credit_id AND (referred_by IS NULL OR referred_by = '')
                ) THEN
                    RAISE NOTICE 'Updating user % linked to referrer %', pending_user.id, referrer_record.user_id;
                    UPDATE public.zetsuguide_credits
                    SET referred_by = referrer_record.user_id
                    WHERE id = existing_credit_id;
                END IF;
            ELSE
                -- Row does not exist: Create it (fetching email from pending_user)
                RAISE NOTICE 'Creating credits for user % linked to referrer %', pending_user.id, referrer_record.user_id;
                INSERT INTO public.zetsuguide_credits (user_id, user_email, credits, referred_by)
                VALUES (pending_user.id, pending_user.email, 10, referrer_record.user_id);
            END IF;
            
        END IF;
    END LOOP;
END $$;

-- Recalculate Totals
CREATE OR REPLACE FUNCTION recalculate_referrals()
RETURNS void AS $$
BEGIN
    UPDATE public.zetsuguide_credits referrer
    SET total_referrals = (
        SELECT COUNT(*)
        FROM public.zetsuguide_credits referent
        WHERE referent.referred_by = referrer.user_id::text
           OR referent.referred_by = referrer.user_id::uuid::text
    ),
    credits = 5 + (
        SELECT COUNT(*)
        FROM public.zetsuguide_credits referent
        WHERE referent.referred_by = referrer.user_id::text
           OR referent.referred_by = referrer.user_id::uuid::text
    ) * 5;
    
    RAISE NOTICE 'Referral stats updated.';
END;
$$ LANGUAGE plpgsql;

SELECT recalculate_referrals();

COMMIT;
