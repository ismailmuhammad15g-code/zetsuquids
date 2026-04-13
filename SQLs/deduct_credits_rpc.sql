-- RPC function to safely deduct credits with reserved_credits support
-- This ensures the check_reserved_credits constraint is never violated

CREATE OR REPLACE FUNCTION deduct_credits(
  user_email_param TEXT,
  amount_param INTEGER
)
RETURNS TABLE (
  success BOOLEAN,
  new_balance INTEGER,
  message TEXT
) AS $$
DECLARE
  current_credits INTEGER;
  current_reserved INTEGER;
  available_credits INTEGER;
  new_credits INTEGER;
BEGIN
  -- Get current credits and reserved credits
  SELECT credits, reserved_credits
  INTO current_credits, current_reserved
  FROM zetsuguide_credits
  WHERE user_email = user_email_param;

  -- Check if user exists
  IF current_credits IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  -- Calculate available credits (credits - reserved_credits)
  available_credits := current_credits - current_reserved;

  -- Check if user has enough available credits
  IF available_credits < amount_param THEN
    RETURN QUERY SELECT false, current_credits, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  -- Deduct credits
  new_credits := current_credits - amount_param;

  -- Update credits
  UPDATE zetsuguide_credits
  SET
    credits = new_credits,
    updated_at = NOW()
  WHERE user_email = user_email_param;

  -- Return success
  RETURN QUERY SELECT true, new_credits, 'Credits deducted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION deduct_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(TEXT, INTEGER) TO anon;
