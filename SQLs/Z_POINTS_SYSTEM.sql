-- SQL Script: Add Z-Points (Zp) System

-- 1. Add z_points column to zetsuguide_credits
ALTER TABLE zetsuguide_credits ADD COLUMN IF NOT EXISTS z_points INTEGER DEFAULT 0;

-- 2. Create function to award Zp
CREATE OR REPLACE FUNCTION award_zpoints(p_user_email TEXT, p_points INTEGER)
RETURNS BOOLEAN AS $$
BEGIN
  UPDATE zetsuguide_credits 
  SET z_points = COALESCE(z_points, 0) + p_points
  WHERE user_email = p_user_email;
  
  IF NOT FOUND THEN
    INSERT INTO zetsuguide_credits (user_email, credits, z_points) 
    VALUES (p_user_email, 0, p_points);
  END IF;
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Create function to convert Zp to Z-Coins (100 Zp = 10 Z-Coins)
CREATE OR REPLACE FUNCTION convert_zpoints(p_user_email TEXT, p_zpoints_to_convert INTEGER)
RETURNS BOOLEAN AS $$
DECLARE
  v_current_zp INTEGER;
  v_coins_to_add INTEGER;
BEGIN
  SELECT z_points INTO v_current_zp FROM zetsuguide_credits WHERE user_email = p_user_email;
  
  IF v_current_zp >= p_zpoints_to_convert AND p_zpoints_to_convert >= 100 THEN
    v_coins_to_add := (p_zpoints_to_convert / 100) * 10;
    
    UPDATE zetsuguide_credits 
    SET z_points = z_points - ((p_zpoints_to_convert / 100) * 100),
        credits = COALESCE(credits, 0) + v_coins_to_add
    WHERE user_email = p_user_email;
    
    RETURN TRUE;
  ELSE
    RETURN FALSE;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create function to check continuous activity for 3 days
CREATE OR REPLACE FUNCTION check_continuous_activity(p_user_email TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_consecutive_days INTEGER;
BEGIN
  -- Simple placeholder implementation. In a real scenario, you'd check a user_activity table.
  -- For now, returning true allows the frontend to trigger the award conditionally.
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
