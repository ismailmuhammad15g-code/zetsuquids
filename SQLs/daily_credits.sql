-- =============================================
-- Daily Credits System
-- Run this in your Supabase SQL Editor
-- =============================================

-- Step 1: Add last_daily_claim column to zetsuguide_credits table
ALTER TABLE zetsuguide_credits
ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMP WITH TIME ZONE;

-- Step 2: Add comment explaining the column
COMMENT ON COLUMN zetsuguide_credits.last_daily_claim IS 'The last time the user claimed their daily credits';

-- Step 3: Create function to claim daily credits
CREATE OR REPLACE FUNCTION claim_daily_credits(p_user_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, credits_awarded INTEGER, new_balance INTEGER) AS $$
DECLARE
    current_credits INTEGER;
    last_claim TIMESTAMP WITH TIME ZONE;
    credits_to_award INTEGER;
BEGIN
    -- Get current user data
    SELECT credits, last_daily_claim INTO current_credits, last_claim
    FROM zetsuguide_credits
    WHERE user_email = LOWER(p_user_email);

    -- Check if user exists
    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'User not found'::TEXT, 0, 0;
        RETURN;
    END IF;

    -- Check if user can claim daily credits (must be at least 24 hours since last claim)
    IF last_claim IS NOT NULL AND NOW() < last_claim + INTERVAL '24 hours' THEN
        RETURN QUERY SELECT false, 'Daily credits already claimed'::TEXT, 0, current_credits;
        RETURN;
    END IF;

    -- Randomly determine how many credits to award (1-5)
    credits_to_award := FLOOR(RANDOM() * 5) + 1;

    -- Update user's credits and last claim time
    UPDATE zetsuguide_credits
    SET
        credits = credits + credits_to_award,
        last_daily_claim = NOW(),
        updated_at = NOW()
    WHERE user_email = LOWER(p_user_email);

    -- Return success response
    RETURN QUERY SELECT true, 'Daily credits claimed successfully!'::TEXT, credits_to_award, current_credits + credits_to_award;
END;
$$ LANGUAGE plpgsql;

-- Step 4: Create function to check if user can claim daily credits
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

-- Step 5: Test the functions (optional)
-- SELECT * FROM claim_daily_credits('test@example.com');
-- SELECT * FROM can_claim_daily_credits('test@example.com');

-- Step 6: Verify the setup
SELECT 'Daily credits system installed successfully' as status;
