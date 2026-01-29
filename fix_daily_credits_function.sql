-- =============================================
-- Fix Daily Credits Function - Type Mismatch
-- Run this in your Supabase SQL Editor
-- =============================================

-- Drop and recreate the function with correct type casting
DROP FUNCTION IF EXISTS can_claim_daily_credits(TEXT);

CREATE OR REPLACE FUNCTION can_claim_daily_credits(p_user_email TEXT)
RETURNS TABLE(can_claim BOOLEAN, hours_remaining DOUBLE PRECISION) AS $$
DECLARE
    last_claim TIMESTAMP WITH TIME ZONE;
    remaining_hours DOUBLE PRECISION;
BEGIN
    -- Get last claim time
    SELECT last_daily_claim INTO last_claim
    FROM zetsuguide_credits
    WHERE user_email = LOWER(p_user_email);

    -- If user doesn't exist or has never claimed, they can claim now
    IF NOT FOUND OR last_claim IS NULL THEN
        RETURN QUERY SELECT true::BOOLEAN, 0.0::DOUBLE PRECISION;
        RETURN;
    END IF;

    -- Check if 24 hours have passed
    IF NOW() >= last_claim + INTERVAL '24 hours' THEN
        RETURN QUERY SELECT true::BOOLEAN, 0.0::DOUBLE PRECISION;
    ELSE
        -- Calculate remaining hours with explicit cast
        remaining_hours := (EXTRACT(EPOCH FROM (last_claim + INTERVAL '24 hours' - NOW())) / 3600)::DOUBLE PRECISION;
        RETURN QUERY SELECT false::BOOLEAN, remaining_hours;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Verify the fix
SELECT 'can_claim_daily_credits function fixed!' as status;
