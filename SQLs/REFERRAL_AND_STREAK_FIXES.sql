-- SQL Script: Ensure Referral Code Exists & Claim Referral Logic

-- 1. Ensure columns exist!
ALTER TABLE zetsuguide_credits ADD COLUMN IF NOT EXISTS referral_code TEXT;
ALTER TABLE zetsuguide_credits ADD COLUMN IF NOT EXISTS referred_by TEXT;
ALTER TABLE zetsuguide_credits ADD COLUMN IF NOT EXISTS total_referrals INTEGER DEFAULT 0;
ALTER TABLE zetsuguide_credits ADD COLUMN IF NOT EXISTS last_daily_claim TIMESTAMP WITH TIME ZONE;
ALTER TABLE zetsuguide_credits ADD COLUMN IF NOT EXISTS z_points INTEGER DEFAULT 0;

-- 2. Ensure all existing users have a referral code
UPDATE zetsuguide_credits 
SET referral_code = UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)) 
WHERE referral_code IS NULL;

-- 3. Modify check_continuous_activity to give a real realistic response for the UI
-- We will just return TRUE for now and award points if it's been a while, but for the sake of demo, we'll allow it once per day.
DROP FUNCTION IF EXISTS check_continuous_activity(text);
CREATE OR REPLACE FUNCTION check_continuous_activity(p_user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_last_claim TIMESTAMP WITH TIME ZONE;
  v_now TIMESTAMP WITH TIME ZONE := NOW();
BEGIN
  -- Reusing last_daily_claim column for this purpose
  SELECT last_daily_claim INTO v_last_claim FROM zetsuguide_credits WHERE user_email = p_user_email;
  
  -- If never claimed or claimed more than 24h ago
  IF v_last_claim IS NULL OR v_now - v_last_claim >= INTERVAL '24 hours' THEN
    -- Award 100 Zp
    UPDATE zetsuguide_credits 
    SET z_points = COALESCE(z_points, 0) + 100,
        last_daily_claim = v_now
    WHERE user_email = p_user_email;
    
    IF NOT FOUND THEN
      -- If user row doesn't exist, create it
      INSERT INTO zetsuguide_credits (user_email, credits, z_points, last_daily_claim, referral_code)
      VALUES (p_user_email, 0, 100, v_now, UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)));
    END IF;

    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Modify process_referral_reward to award 100 Zp AND credits!
-- The user said: "when the other user enters the site and registers, he and I both get 100 Zp"
DROP FUNCTION IF EXISTS process_referral_reward(text, text);
CREATE OR REPLACE FUNCTION process_referral_reward(p_new_user_email TEXT, p_referral_code TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_referrer_email TEXT;
BEGIN
  -- 1. Check if referral code is valid
  SELECT user_email INTO v_referrer_email FROM zetsuguide_credits WHERE referral_code = p_referral_code;
  
  IF v_referrer_email IS NULL THEN
    RETURN FALSE; -- Invalid referral code
  END IF;

  -- Prevent self-referral
  IF v_referrer_email = p_new_user_email THEN
    RETURN FALSE;
  END IF;

  -- 2. Award 100 Zp to the referrer and increment total_referrals
  UPDATE zetsuguide_credits
  SET z_points = COALESCE(z_points, 0) + 100,
      total_referrals = COALESCE(total_referrals, 0) + 1
  WHERE user_email = v_referrer_email;

  -- 3. Award 100 Zp to the new user and set referred_by
  UPDATE zetsuguide_credits
  SET z_points = COALESCE(z_points, 0) + 100,
      referred_by = v_referrer_email
  WHERE user_email = p_new_user_email;
  
  -- If new user doesn't have a row yet (which shouldn't happen if they just signed up and got their 5 credits, but just in case)
  IF NOT FOUND THEN
    INSERT INTO zetsuguide_credits (user_email, credits, z_points, referred_by, referral_code)
    VALUES (p_new_user_email, 5, 100, v_referrer_email, UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8)));
  END IF;

  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 5. Create function to generate referral code explicitly
DROP FUNCTION IF EXISTS generate_referral_code(text);
CREATE OR REPLACE FUNCTION generate_referral_code(p_user_email TEXT)
RETURNS TEXT AS $$
DECLARE
  v_code TEXT;
BEGIN
  v_code := UPPER(SUBSTRING(MD5(RANDOM()::TEXT) FROM 1 FOR 8));
  
  UPDATE zetsuguide_credits 
  SET referral_code = v_code 
  WHERE user_email = p_user_email AND referral_code IS NULL;
  
  IF NOT FOUND THEN
    -- If user doesn't exist in credits table, insert them
    INSERT INTO zetsuguide_credits (user_email, credits, z_points, referral_code)
    VALUES (p_user_email, 5, 0, v_code);
  END IF;
  
  RETURN v_code;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
