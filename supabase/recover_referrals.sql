-- RECOVER MISSING REFERRALS
-- This script looks for users who tried to sign up with a referral code but the process failed (e.g. 500 error).
-- It finds them in auth.users metadata and links them to the referrer in your credits table.

BEGIN;

DO $$
DECLARE
    pending_user RECORD;
    referrer_record RECORD;
    pending_code TEXT;
BEGIN
    -- Loop through all users who have a 'referral_pending' tag in their metadata
    -- AND who don't have a 'referred_by' set in the credits table yet.
    FOR pending_user IN
        SELECT u.id, u.raw_user_meta_data->>'referral_pending' as code
        FROM auth.users u
        LEFT JOIN public.zetsuguide_credits c ON u.id = c.user_id
        WHERE u.raw_user_meta_data->>'referral_pending' IS NOT NULL
          AND (c.referred_by IS NULL OR c.referred_by = '')
    LOOP
        pending_code := pending_user.code;
        
        -- Find who owns this code
        SELECT * INTO referrer_record 
        FROM public.zetsuguide_credits 
        WHERE referral_code = pending_code;
        
        IF FOUND THEN
            RAISE NOTICE 'Recovering referral: User % was referred by % (Code: %)', pending_user.id, referrer_record.user_id, pending_code;
            
            -- 1. Link the new user to the referrer
            UPDATE public.zetsuguide_credits
            SET referred_by = referrer_record.user_id
            WHERE user_id = pending_user.id;
            
            -- If the user didn't have a credits row yet, create it
            IF NOT FOUND THEN
                INSERT INTO public.zetsuguide_credits (user_id, credits, referred_by)
                VALUES (pending_user.id, 10, referrer_record.user_id) -- 5 base + 5 bonus
                ON CONFLICT (user_id) DO UPDATE
                SET referred_by = referrer_record.user_id;
            END IF;
            
            -- 2. Mark metadata as completed (so we don't process again)
            -- Note: We can't easily update auth.users metadata from PL/pgSQL usually, 
            -- but fixing the 'referred_by' link is enough for the stats to count.
            
        ELSE
            RAISE NOTICE 'Skipping: Invalid code % for user %', pending_code, pending_user.id;
        END IF;
    END LOOP;
END $$;

-- 3. Now recalculate the totals based on these new links
CREATE OR REPLACE FUNCTION recalculate_referrals()
RETURNS void AS $$
BEGIN
    -- Update referrer stats
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
