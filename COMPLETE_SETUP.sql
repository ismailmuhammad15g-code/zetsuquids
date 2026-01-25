-- =============================================
-- ZetsuGuides Complete Setup Script
-- Run this ENTIRE file in your new Supabase Project's SQL Editor
-- =============================================

-- =============================================
-- PART 1: Guides Table
-- =============================================

-- Drop existing table if exists
DROP TABLE IF EXISTS guides CASCADE;

-- Create guides table
CREATE TABLE IF NOT EXISTS guides (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  markdown TEXT DEFAULT '',
  html_content TEXT DEFAULT '',
  css_content TEXT DEFAULT '',
  keywords TEXT[] DEFAULT '{}',
  content_type TEXT DEFAULT 'markdown',
  user_email TEXT, -- Owner email
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_guides_slug ON guides (slug);
CREATE INDEX IF NOT EXISTS idx_guides_created_at ON guides (created_at DESC);

-- Allow all operations (Public Access)
DROP POLICY IF EXISTS "Allow all operations" ON guides;
CREATE POLICY "Allow all operations" ON guides
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- =============================================
-- PART 2: Credits & Referrals System
-- =============================================

-- Create credits table
CREATE TABLE IF NOT EXISTS zetsuguide_credits (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 5,
  total_used INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  total_referrals INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE zetsuguide_credits ENABLE ROW LEVEL SECURITY;

-- Allow all operations on credits
DROP POLICY IF EXISTS "Allow all operations on credits" ON zetsuguide_credits;
CREATE POLICY "Allow all operations on credits" ON zetsuguide_credits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credits_email ON zetsuguide_credits (user_email);
CREATE INDEX IF NOT EXISTS idx_credits_referral_code ON zetsuguide_credits (referral_code);

-- Create Referrals Table
CREATE TABLE IF NOT EXISTS zetsuguide_referrals (
  id BIGSERIAL PRIMARY KEY,
  referrer_email TEXT NOT NULL,
  referred_email TEXT UNIQUE NOT NULL,
  credits_awarded INTEGER DEFAULT 5,
  verified BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE zetsuguide_referrals ENABLE ROW LEVEL SECURITY;

-- Allow all operations on referral logs
DROP POLICY IF EXISTS "Allow all operations on referrals" ON zetsuguide_referrals;
CREATE POLICY "Allow all operations on referrals" ON zetsuguide_referrals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON zetsuguide_referrals (referrer_email);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON zetsuguide_referrals (referred_email);

-- =============================================
-- PART 3: Functions
-- =============================================

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
  code_exists BOOLEAN;
BEGIN
  LOOP
    -- Generate a random 8-character code
    new_code := UPPER(SUBSTRING(MD5(p_email || NOW()::TEXT || RANDOM()::TEXT) FROM 1 FOR 8));
    
    -- Check if code exists
    SELECT EXISTS(
      SELECT 1 FROM zetsuguide_credits WHERE referral_code = new_code
    ) INTO code_exists;
    
    EXIT WHEN NOT code_exists;
  END LOOP;
  
  RETURN new_code;
END;
$$ LANGUAGE plpgsql;

-- Function to get or create user credits with referral code
CREATE OR REPLACE FUNCTION get_or_create_credits(p_email TEXT)
RETURNS TABLE(
  credits INTEGER,
  referral_code TEXT,
  total_referrals INTEGER
) AS $$
DECLARE
  new_code TEXT;
BEGIN
  -- Check if user exists
  IF NOT EXISTS (SELECT 1 FROM zetsuguide_credits WHERE user_email = p_email) THEN
    -- Generate referral code
    new_code := generate_referral_code(p_email);
    
    -- Create new user
    INSERT INTO zetsuguide_credits (user_email, credits, referral_code)
    VALUES (p_email, 5, new_code);
  END IF;
  
  -- Return user data
  RETURN QUERY 
  SELECT zc.credits, zc.referral_code, zc.total_referrals
  FROM zetsuguide_credits zc
  WHERE zc.user_email = p_email;
END;
$$ LANGUAGE plpgsql;

-- Function to process referral on registration
CREATE OR REPLACE FUNCTION process_referral(
  p_new_user_email TEXT,
  p_referral_code TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
DECLARE
  referrer_email_found TEXT;
  already_referred BOOLEAN;
BEGIN
  -- Validation 1: Check if new user already used a referral
  SELECT EXISTS(
    SELECT 1 FROM zetsuguide_referrals WHERE referred_email = p_new_user_email
  ) INTO already_referred;
  
  IF already_referred THEN
    RETURN QUERY SELECT false, 'User has already been referred by someone'::TEXT;
    RETURN;
  END IF;
  
  -- Validation 2: Find the referrer by code
  SELECT user_email INTO referrer_email_found
  FROM zetsuguide_credits
  WHERE referral_code = p_referral_code;
  
  IF referrer_email_found IS NULL THEN
    RETURN QUERY SELECT false, 'Invalid referral code'::TEXT;
    RETURN;
  END IF;
  
  -- Validation 3: User cannot refer themselves
  IF referrer_email_found = p_new_user_email THEN
    RETURN QUERY SELECT false, 'Cannot use your own referral code'::TEXT;
    RETURN;
  END IF;
  
  -- Record the referral
  INSERT INTO zetsuguide_referrals (referrer_email, referred_email, credits_awarded, verified)
  VALUES (referrer_email_found, p_new_user_email, 5, true);
  
  -- Award 5 credits to referrer
  UPDATE zetsuguide_credits
  SET credits = credits + 5,
      total_referrals = total_referrals + 1,
      updated_at = NOW()
  WHERE user_email = referrer_email_found;
  
  -- Mark new user as referred
  UPDATE zetsuguide_credits
  SET referred_by = referrer_email_found
  WHERE user_email = p_new_user_email;
  
  RETURN QUERY SELECT true, 'Referral processed successfully! 5 credits awarded.'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to use credit
CREATE OR REPLACE FUNCTION use_zetsuguide_credit(p_email TEXT)
RETURNS TABLE(success BOOLEAN, remaining_credits INTEGER) AS $$
DECLARE
  current_credits INTEGER;
BEGIN
  -- Get or create user credits
  INSERT INTO zetsuguide_credits (user_email, credits, referral_code)
  VALUES (p_email, 5, generate_referral_code(p_email))
  ON CONFLICT (user_email) DO NOTHING;
  
  -- Get current credits
  SELECT credits INTO current_credits
  FROM zetsuguide_credits
  WHERE user_email = p_email;
  
  -- Check if credits available
  IF current_credits > 0 THEN
    -- Deduct credit
    UPDATE zetsuguide_credits
    SET credits = credits - 1,
        total_used = total_used + 1,
        updated_at = NOW()
    WHERE user_email = p_email;
    
    RETURN QUERY SELECT true, current_credits - 1;
  ELSE
    RETURN QUERY SELECT false, 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

SELECT 'COMPLETE_SETUP.sql executed successfully' as status;
