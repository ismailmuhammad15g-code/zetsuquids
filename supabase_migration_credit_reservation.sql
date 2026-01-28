-- Credit Reservation System Migration
-- This adds support for reserving credits before API calls
-- Run this SQL in your Supabase SQL Editor

-- Step 1: Add reserved_credits column to zetsuguide_credits table
ALTER TABLE zetsuguide_credits 
ADD COLUMN IF NOT EXISTS reserved_credits INTEGER DEFAULT 0;

-- Step 2: Add comment explaining the column
COMMENT ON COLUMN zetsuguide_credits.reserved_credits IS 'Credits that are temporarily reserved during AI API calls. Released back if call fails.';

-- Step 3: Create index for performance
CREATE INDEX IF NOT EXISTS idx_zetsuguide_credits_reserved 
ON zetsuguide_credits(reserved_credits) 
WHERE reserved_credits > 0;

-- Step 4: Add constraint to ensure reserved_credits doesn't exceed credits
ALTER TABLE zetsuguide_credits 
ADD CONSTRAINT check_reserved_credits 
CHECK (reserved_credits >= 0 AND reserved_credits <= credits);

-- Step 5: Create helper function to reserve credits
CREATE OR REPLACE FUNCTION reserve_credit(user_email_param TEXT)
RETURNS TABLE(success BOOLEAN, remaining_credits INTEGER, reserved INTEGER) AS $$
DECLARE
    current_credits INTEGER;
    current_reserved INTEGER;
BEGIN
    -- Lock the row for update
    SELECT credits, reserved_credits INTO current_credits, current_reserved
    FROM zetsuguide_credits
    WHERE user_email = LOWER(user_email_param)
    FOR UPDATE;

    -- Check if user has available credits (not reserved)
    IF (current_credits - current_reserved) < 1 THEN
        RETURN QUERY SELECT FALSE, current_credits, current_reserved;
        RETURN;
    END IF;

    -- Reserve 1 credit
    UPDATE zetsuguide_credits
    SET reserved_credits = reserved_credits + 1,
        updated_at = NOW()
    WHERE user_email = LOWER(user_email_param);

    -- Return success with new values
    RETURN QUERY SELECT TRUE, current_credits, current_reserved + 1;
END;
$$ LANGUAGE plpgsql;

-- Step 6: Create helper function to commit reserved credit (deduct it)
CREATE OR REPLACE FUNCTION commit_reserved_credit(user_email_param TEXT)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER) AS $$
DECLARE
    current_credits INTEGER;
    current_reserved INTEGER;
BEGIN
    -- Lock the row for update
    SELECT credits, reserved_credits INTO current_credits, current_reserved
    FROM zetsuguide_credits
    WHERE user_email = LOWER(user_email_param)
    FOR UPDATE;

    -- Check if there's a reserved credit to commit
    IF current_reserved < 1 THEN
        RETURN QUERY SELECT FALSE, current_credits;
        RETURN;
    END IF;

    -- Deduct the credit and unreserve it
    UPDATE zetsuguide_credits
    SET credits = credits - 1,
        reserved_credits = reserved_credits - 1,
        updated_at = NOW()
    WHERE user_email = LOWER(user_email_param);

    -- Return success with new balance
    RETURN QUERY SELECT TRUE, current_credits - 1;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Create helper function to release reserved credit (on error)
CREATE OR REPLACE FUNCTION release_reserved_credit(user_email_param TEXT)
RETURNS TABLE(success BOOLEAN, credits_remaining INTEGER) AS $$
DECLARE
    current_credits INTEGER;
    current_reserved INTEGER;
BEGIN
    -- Lock the row for update
    SELECT credits, reserved_credits INTO current_credits, current_reserved
    FROM zetsuguide_credits
    WHERE user_email = LOWER(user_email_param)
    FOR UPDATE;

    -- Check if there's a reserved credit to release
    IF current_reserved < 1 THEN
        RETURN QUERY SELECT FALSE, current_credits;
        RETURN;
    END IF;

    -- Release the reserved credit (no deduction)
    UPDATE zetsuguide_credits
    SET reserved_credits = reserved_credits - 1,
        updated_at = NOW()
    WHERE user_email = LOWER(user_email_param);

    -- Return success with unchanged balance
    RETURN QUERY SELECT TRUE, current_credits;
END;
$$ LANGUAGE plpgsql;

-- Step 8: Verify the setup
SELECT 
    user_email,
    credits,
    reserved_credits,
    (credits - reserved_credits) as available_credits
FROM zetsuguide_credits
LIMIT 5;

-- Migration complete!
-- The system now supports:
-- 1. reserve_credit(email) - Reserve 1 credit before API call
-- 2. commit_reserved_credit(email) - Deduct the reserved credit on success
-- 3. release_reserved_credit(email) - Return the reserved credit on error
