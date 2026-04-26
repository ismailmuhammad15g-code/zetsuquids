-- ==================================================================================
-- ZETSUSAVE COMPLETE MERGED DATABASE SCHEMA
-- Comprehensive Supabase Schema - All Features Included
-- Created: April 2026
-- This file contains the complete schema for a fresh Supabase deployment
-- ==================================================================================

-- ===== SECTION: Enable Required Extensions =====
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_cron";

-- ==================================================================================
-- PART 1: CORE GUIDES AND CONTENT SYSTEM
-- ==================================================================================

-- ===== SECTION: supabase-setup.sql - Core Guides Table =====
CREATE TABLE IF NOT EXISTS guides (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  content TEXT DEFAULT '',
  markdown TEXT DEFAULT '',
  html_content TEXT DEFAULT '',
  css_content TEXT DEFAULT '',
  cover_image TEXT,
  keywords TEXT[] DEFAULT '{}',
  content_type TEXT DEFAULT 'markdown',
  user_email TEXT,
  author_name VARCHAR(255),
  author_id UUID,
  views_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'pending',
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_guides_slug ON guides (slug);
CREATE INDEX IF NOT EXISTS idx_guides_title ON guides USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_guides_content ON guides USING GIN (to_tsvector('english', markdown));
CREATE INDEX IF NOT EXISTS idx_guides_keywords ON guides USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_guides_created_at ON guides (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_guides_author_email ON guides(user_email);
CREATE INDEX IF NOT EXISTS idx_guides_author_id ON guides(author_id);
CREATE INDEX IF NOT EXISTS guides_status_idx ON guides(status);

-- Enable Row Level Security (RLS)
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for guides table
DROP TRIGGER IF EXISTS update_guides_updated_at ON guides;
CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- RLS Policies for guides
DROP POLICY IF EXISTS "Enable read access for all users" ON guides;
CREATE POLICY "Enable read access for all users" ON guides
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON guides;
CREATE POLICY "Enable insert access for all users" ON guides
  FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update access for all users" ON guides;
CREATE POLICY "Enable update access for all users" ON guides
  FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete their own guides" ON guides;
CREATE POLICY "Users can delete their own guides"
ON guides
FOR DELETE
USING (
    auth.jwt() ->> 'email' = user_email
);

DROP POLICY IF EXISTS "Users can view all guides" ON guides;
CREATE POLICY "Users can view all guides"
ON guides
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert guides" ON guides;
CREATE POLICY "Users can insert guides"
ON guides
FOR INSERT
WITH CHECK (
    auth.jwt() ->> 'email' = user_email
);

DROP POLICY IF EXISTS "Users can update their own guides" ON guides;
CREATE POLICY "Users can update their own guides"
ON guides
FOR UPDATE
USING (
    auth.jwt() ->> 'email' = user_email
);

-- Full-text search function
CREATE OR REPLACE FUNCTION search_guides(search_query TEXT)
RETURNS SETOF guides AS $$
BEGIN
  RETURN QUERY
  SELECT *
  FROM guides
  WHERE
    to_tsvector('english', title) @@ plainto_tsquery('english', search_query)
    OR to_tsvector('english', markdown) @@ plainto_tsquery('english', search_query)
    OR search_query = ANY(keywords)
  ORDER BY
    CASE
      WHEN title ILIKE '%' || search_query || '%' THEN 1
      WHEN search_query = ANY(keywords) THEN 2
      ELSE 3
    END,
    created_at DESC;
END;
$$ LANGUAGE plpgsql;

-- ===== SECTION: zetsuguide-credits.sql - Credits & Referrals System =====
CREATE TABLE IF NOT EXISTS zetsuguide_credits (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID,
  user_email TEXT UNIQUE NOT NULL,
  credits INTEGER DEFAULT 5,
  total_used INTEGER DEFAULT 0,
  reserved_credits INTEGER DEFAULT 0,
  referral_code TEXT UNIQUE,
  referred_by TEXT,
  total_referrals INTEGER DEFAULT 0,
  last_daily_claim TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add missing columns safely
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zetsuguide_credits' AND column_name='referral_code') THEN
    ALTER TABLE zetsuguide_credits ADD COLUMN referral_code TEXT UNIQUE;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zetsuguide_credits' AND column_name='referred_by') THEN
    ALTER TABLE zetsuguide_credits ADD COLUMN referred_by TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zetsuguide_credits' AND column_name='total_referrals') THEN
    ALTER TABLE zetsuguide_credits ADD COLUMN total_referrals INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zetsuguide_credits' AND column_name='reserved_credits') THEN
    ALTER TABLE zetsuguide_credits ADD COLUMN reserved_credits INTEGER DEFAULT 0;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name='zetsuguide_credits' AND column_name='last_daily_claim') THEN
    ALTER TABLE zetsuguide_credits ADD COLUMN last_daily_claim TIMESTAMP WITH TIME ZONE;
  END IF;
END $$;

-- Add constraint to ensure reserved_credits doesn't exceed credits (idempotent)
ALTER TABLE zetsuguide_credits DROP CONSTRAINT IF EXISTS check_reserved_credits;
ALTER TABLE zetsuguide_credits
ADD CONSTRAINT check_reserved_credits
CHECK (reserved_credits >= 0 AND reserved_credits <= credits);

-- Enable RLS
ALTER TABLE zetsuguide_credits ENABLE ROW LEVEL SECURITY;

-- Policy for all operations
DROP POLICY IF EXISTS "Allow all operations on credits" ON zetsuguide_credits;
CREATE POLICY "Allow all operations on credits" ON zetsuguide_credits
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_credits_email ON zetsuguide_credits (user_email);
CREATE INDEX IF NOT EXISTS idx_credits_referral_code ON zetsuguide_credits (referral_code);
CREATE INDEX IF NOT EXISTS idx_zetsuguide_credits_reserved ON zetsuguide_credits(reserved_credits) WHERE reserved_credits > 0;

-- COMMENT ON COLUMN for documentation
COMMENT ON COLUMN zetsuguide_credits.last_daily_claim IS 'The last time the user claimed their daily credits';
COMMENT ON COLUMN zetsuguide_credits.reserved_credits IS 'Credits that are temporarily reserved during AI API calls. Released back if call fails.';

-- Referrals tracking table
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

-- Policy
DROP POLICY IF EXISTS "Allow all operations on referrals" ON zetsuguide_referrals;
CREATE POLICY "Allow all operations on referrals" ON zetsuguide_referrals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON zetsuguide_referrals (referrer_email);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON zetsuguide_referrals (referred_email);

-- Function to generate unique referral code
CREATE OR REPLACE FUNCTION generate_referral_code(p_email TEXT)
RETURNS TEXT AS $$
DECLARE
  new_code TEXT;
BEGIN
  LOOP
    new_code := UPPER(SUBSTRING(MD5(p_email || NOW()::TEXT || RANDOM()::TEXT) FROM 1 FOR 8));
    IF (SELECT COUNT(*) FROM zetsuguide_credits WHERE referral_code = new_code) = 0 THEN
      EXIT;
    END IF;
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
  IF NOT EXISTS (SELECT 1 FROM zetsuguide_credits WHERE user_email = p_email) THEN
    new_code := generate_referral_code(p_email);
    INSERT INTO zetsuguide_credits (user_email, credits, referral_code)
    VALUES (p_email, 5, new_code);
  END IF;

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
BEGIN
  IF (SELECT COUNT(*) FROM zetsuguide_referrals WHERE referred_email = p_new_user_email) > 0 THEN
    RETURN QUERY SELECT false, 'User has already been referred by someone'::TEXT;
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM zetsuguide_credits WHERE referral_code = p_referral_code) THEN
    RETURN QUERY SELECT false, 'Invalid referral code'::TEXT;
    RETURN;
  END IF;

  IF (SELECT user_email FROM zetsuguide_credits WHERE referral_code = p_referral_code) = p_new_user_email THEN
    RETURN QUERY SELECT false, 'Cannot use your own referral code'::TEXT;
    RETURN;
  END IF;

  INSERT INTO zetsuguide_referrals (referrer_email, referred_email, credits_awarded, verified)
  SELECT user_email, p_new_user_email, 5, true
  FROM zetsuguide_credits WHERE referral_code = p_referral_code;

  UPDATE zetsuguide_credits
  SET credits = credits + 5,
      total_referrals = total_referrals + 1,
      updated_at = NOW()
  WHERE referral_code = p_referral_code;

  UPDATE zetsuguide_credits
  SET referred_by = (SELECT user_email FROM zetsuguide_credits WHERE referral_code = p_referral_code)
  WHERE user_email = p_new_user_email;

  RETURN QUERY SELECT true, 'Referral processed successfully! 5 credits awarded.'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Function to use credit
CREATE OR REPLACE FUNCTION use_zetsuguide_credit(p_email TEXT)
RETURNS TABLE(success BOOLEAN, remaining_credits INTEGER) AS $$
BEGIN
  INSERT INTO zetsuguide_credits (user_email, credits, referral_code)
  VALUES (p_email, 5, generate_referral_code(p_email))
  ON CONFLICT (user_email) DO NOTHING;

  IF (SELECT credits FROM zetsuguide_credits WHERE user_email = p_email) > 0 THEN
    UPDATE zetsuguide_credits
    SET credits = credits - 1,
        total_used = total_used + 1,
        updated_at = NOW()
    WHERE user_email = p_email;

    RETURN QUERY SELECT true, (SELECT credits FROM zetsuguide_credits WHERE user_email = p_email);
  ELSE
    RETURN QUERY SELECT false, 0;
  END IF;
END;
$$ LANGUAGE plpgsql;

-- Function to get referral stats
CREATE OR REPLACE FUNCTION get_referral_stats(p_email TEXT)
RETURNS TABLE(
  referral_code TEXT,
  total_referrals INTEGER,
  credits_earned_from_referrals INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    zc.referral_code,
    zc.total_referrals,
    zc.total_referrals * 5 as credits_earned_from_referrals
  FROM zetsuguide_credits zc
  WHERE zc.user_email = p_email;
END;
$$ LANGUAGE plpgsql;

-- Function to claim missing referral bonus
CREATE OR REPLACE FUNCTION claim_missing_referral_bonus(
  p_user_email TEXT,
  p_referral_code TEXT
)
RETURNS TABLE(success BOOLEAN, message TEXT) AS $$
BEGIN
  IF (SELECT referred_by IS NOT NULL FROM zetsuguide_credits WHERE user_email = p_user_email) THEN
    RETURN QUERY SELECT false, 'User already has a referrer set via SQL.'::TEXT;
    RETURN;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM zetsuguide_credits WHERE referral_code = p_referral_code) THEN
    RETURN QUERY SELECT false, 'Invalid referral code.'::TEXT;
    RETURN;
  END IF;

  UPDATE zetsuguide_credits
  SET credits = credits + 5,
      total_referrals = total_referrals + 1
  WHERE referral_code = p_referral_code;

  INSERT INTO zetsuguide_referrals (referrer_email, referred_email, credits_awarded, verified)
  SELECT user_email, p_user_email, 5, true
  FROM zetsuguide_credits WHERE referral_code = p_referral_code
  ON CONFLICT (referred_email) DO NOTHING;

  UPDATE zetsuguide_credits
  SET credits = credits + 5,
      referred_by = referrer_email_found
  WHERE user_email = p_user_email;

  RETURN QUERY SELECT true, 'Bonus claimed successfully! Both users received 5 credits.'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- ===== SECTION: setup_profiles.sql - User Profiles =====
CREATE TABLE IF NOT EXISTS zetsuguide_user_profiles (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  user_email TEXT UNIQUE NOT NULL,
  username TEXT UNIQUE,
  display_name TEXT,
  banner_url TEXT,
  location TEXT,
  website TEXT,
  account_type TEXT CHECK (account_type in ('individual', 'company')),
  company_size TEXT,
  avatar_url TEXT,
  referral_source TEXT,
  bio TEXT,
  followers_count INT DEFAULT 0,
  following_count INT DEFAULT 0,
  has_seen_onboarding BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure columns exist for existing tables
ALTER TABLE zetsuguide_user_profiles ADD COLUMN IF NOT EXISTS username TEXT UNIQUE;
ALTER TABLE zetsuguide_user_profiles ADD COLUMN IF NOT EXISTS display_name TEXT;
ALTER TABLE zetsuguide_user_profiles ADD COLUMN IF NOT EXISTS banner_url TEXT;
ALTER TABLE zetsuguide_user_profiles ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE zetsuguide_user_profiles ADD COLUMN IF NOT EXISTS website TEXT;

-- Migration to ensure all profiles have a username and display_name
UPDATE zetsuguide_user_profiles
SET
  username = COALESCE(username, LOWER(SPLIT_PART(user_email, '@', 1))),
  display_name = COALESCE(display_name, INITCAP(SPLIT_PART(user_email, '@', 1)))
WHERE username IS NULL OR display_name IS NULL;


-- Trigger to ensure new profiles always get a default username/display_name
CREATE OR REPLACE FUNCTION ensure_profile_identity() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.username IS NULL THEN
    NEW.username := LOWER(SPLIT_PART(NEW.user_email, '@', 1));
  END IF;
  IF NEW.display_name IS NULL THEN
    NEW.display_name := INITCAP(SPLIT_PART(NEW.user_email, '@', 1));
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_ensure_profile_identity ON zetsuguide_user_profiles;
CREATE TRIGGER trg_ensure_profile_identity
BEFORE INSERT ON zetsuguide_user_profiles
FOR EACH ROW EXECUTE FUNCTION ensure_profile_identity();

-- Enable RLS
ALTER TABLE zetsuguide_user_profiles ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own profile" ON zetsuguide_user_profiles;
CREATE POLICY "Users can view their own profile"
  ON zetsuguide_user_profiles FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "Users can insert their own profile" ON zetsuguide_user_profiles;
CREATE POLICY "Users can insert their own profile"
  ON zetsuguide_user_profiles FOR INSERT
  WITH CHECK (auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "Users can update their own profile" ON zetsuguide_user_profiles;
CREATE POLICY "Users can update their own profile"
  ON zetsuguide_user_profiles FOR UPDATE
  USING (auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "Public profiles are viewable" ON zetsuguide_user_profiles;
CREATE POLICY "Public profiles are viewable" ON zetsuguide_user_profiles
    FOR SELECT USING (true);

-- COMMENTS
COMMENT ON COLUMN zetsuguide_user_profiles.bio IS 'User biography/description (max 200 characters)';

-- ===== SECTION: setup_usage_logs.sql - Usage Logs System =====
CREATE TABLE IF NOT EXISTS zetsuguide_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  cost INTEGER DEFAULT 1,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE zetsuguide_usage_logs ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Users can view own logs" ON zetsuguide_usage_logs;
CREATE POLICY "Users can view own logs" ON zetsuguide_usage_logs
  FOR SELECT
  USING (auth.uid()::text = user_email OR user_email = current_user);

DROP POLICY IF EXISTS "Users can insert own logs" ON zetsuguide_usage_logs;
CREATE POLICY "Users can insert own logs" ON zetsuguide_usage_logs
  FOR INSERT
  WITH CHECK (true);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_usage_logs_email ON zetsuguide_usage_logs (user_email);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON zetsuguide_usage_logs (created_at DESC);

-- ===== SECTION: create_usage_logs_table.sql - Usage Logs Table =====
CREATE TABLE IF NOT EXISTS usage_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL,
  details TEXT,
  credits_used INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_usage_logs_user_email ON usage_logs(user_email);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created_at ON usage_logs(created_at DESC);

-- Enable RLS
ALTER TABLE usage_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can insert their own usage logs" ON usage_logs;
CREATE POLICY "Users can insert their own usage logs"
  ON usage_logs
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Users can view their own usage logs" ON usage_logs;
CREATE POLICY "Users can view their own usage logs"
  ON usage_logs
  FOR SELECT
  USING (auth.jwt() ->> 'email' = user_email);

DROP POLICY IF EXISTS "Service role can manage all logs" ON usage_logs;
CREATE POLICY "Service role can manage all logs"
  ON usage_logs
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role');

-- ==================================================================================
-- PART 2: RECOMMENDATIONS AND INTERACTIONS
-- ==================================================================================

-- ===== SECTION: create_recommendations_system.sql - User Guide Interactions =====
CREATE TABLE IF NOT EXISTS user_guide_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  guide_id UUID NOT NULL,
  guide_slug TEXT NOT NULL,
  interaction_type TEXT NOT NULL,
  interaction_score INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_guide_interactions_user_email ON user_guide_interactions(user_email);
CREATE INDEX IF NOT EXISTS idx_user_guide_interactions_guide_slug ON user_guide_interactions(guide_slug);
CREATE INDEX IF NOT EXISTS idx_user_guide_interactions_type ON user_guide_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_guide_interactions_created_at ON user_guide_interactions(created_at DESC);

-- Enable RLS
ALTER TABLE user_guide_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Users can view their own interactions" ON user_guide_interactions;
CREATE POLICY "Users can view their own interactions"
  ON user_guide_interactions
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'email' = user_email);

DROP POLICY IF EXISTS "Users can insert their own interactions" ON user_guide_interactions;
CREATE POLICY "Users can insert their own interactions"
  ON user_guide_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'email' = user_email);

DROP POLICY IF EXISTS "Users can update their own interactions" ON user_guide_interactions;
CREATE POLICY "Users can update their own interactions"
  ON user_guide_interactions
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.jwt()->>'email' = user_email);

-- Function to record user interaction
CREATE OR REPLACE FUNCTION record_guide_interaction(
  p_user_email TEXT,
  p_guide_slug TEXT,
  p_interaction_type TEXT,
  p_interaction_score INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_guide_id UUID;
BEGIN
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email
  LIMIT 1;

  SELECT id INTO v_guide_id
  FROM guides
  WHERE slug = p_guide_slug
  LIMIT 1;

  IF v_user_id IS NOT NULL AND v_guide_id IS NOT NULL THEN
    INSERT INTO user_guide_interactions (
      user_id,
      user_email,
      guide_id,
      guide_slug,
      interaction_type,
      interaction_score
    )
    VALUES (
      v_user_id,
      p_user_email,
      v_guide_id,
      p_guide_slug,
      p_interaction_type,
      p_interaction_score
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get personalized recommendations
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  p_user_email TEXT,
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  user_email TEXT,
  author_name TEXT,
  keywords TEXT[],
  created_at TIMESTAMPTZ,
  views_count INTEGER,
  recommendation_score NUMERIC,
  recommendation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_interactions AS (
    SELECT DISTINCT guide_slug, SUM(interaction_score) as total_score
    FROM user_guide_interactions
    WHERE user_guide_interactions.user_email = p_user_email
    GROUP BY guide_slug
  ),
  user_interests AS (
    SELECT DISTINCT UNNEST(g.keywords) as tag
    FROM guides g
    INNER JOIN user_interactions ui ON g.slug = ui.guide_slug
    WHERE g.keywords IS NOT NULL AND array_length(g.keywords, 1) > 0
  ),
  followed_authors AS (
    SELECT following_email
    FROM user_follows
    WHERE follower_email = p_user_email
  ),
  recommended_guides AS (
    SELECT
      g.slug,
      g.title,
      g.user_email,
      g.author_name,
      g.keywords,
      g.created_at,
      COALESCE(g.views_count, 0)::INTEGER as views_count,
      (
        CASE WHEN EXISTS (SELECT 1 FROM followed_authors fa WHERE fa.following_email = g.user_email)
          THEN 10 ELSE 0 END
        +
        (SELECT COUNT(*) * 5
         FROM user_interests ui
         WHERE ui.tag = ANY(g.keywords))
        +
        LEAST(COALESCE(g.views_count, 0) / 20.0, 5)
        +
        CASE WHEN g.created_at > NOW() - INTERVAL '30 days'
          THEN 3 ELSE 0 END
        +
        CASE WHEN EXISTS (SELECT 1 FROM guide_comments gc WHERE gc.guide_id = g.id)
          THEN 2 ELSE 0 END
      ) as score,
      CASE
        WHEN EXISTS (SELECT 1 FROM followed_authors fa WHERE fa.following_email = g.user_email)
          THEN 'From author you follow'
        WHEN (SELECT COUNT(*) FROM user_interests ui WHERE ui.tag = ANY(g.keywords)) > 0
          THEN 'Similar to guides you read'
        WHEN COALESCE(g.views_count, 0) > 50
          THEN 'Popular guide'
        ELSE 'Recommended for you'
      END as reason
    FROM guides g
    WHERE
      g.slug NOT IN (SELECT guide_slug FROM user_interactions)
  )
  SELECT
    rg.slug::TEXT,
    rg.title::TEXT,
    rg.user_email::TEXT,
    rg.author_name::TEXT,
    rg.keywords::TEXT[],
    rg.created_at,
    rg.views_count,
    rg.score as recommendation_score,
    rg.reason::TEXT as recommendation_reason
  FROM recommended_guides rg
  WHERE rg.score > 0
  ORDER BY rg.score DESC, rg.views_count DESC, rg.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get trending guides
CREATE OR REPLACE FUNCTION get_trending_guides(
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  user_email TEXT,
  author_name TEXT,
  keywords TEXT[],
  created_at TIMESTAMPTZ,
  views_count INTEGER,
  recommendation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.slug::TEXT,
    g.title::TEXT,
    g.user_email::TEXT,
    g.author_name::TEXT,
    g.keywords::TEXT[],
    g.created_at,
    COALESCE(g.views_count, 0)::INTEGER as views_count,
    'Trending guide'::TEXT as recommendation_reason
  FROM guides g
  ORDER BY
    (COALESCE(g.views_count, 0) * 0.7 +
     CASE WHEN g.created_at > NOW() - INTERVAL '7 days' THEN 30 ELSE 0 END) DESC,
    g.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_guide_interaction TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_personalized_recommendations TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_trending_guides TO authenticated, anon;

-- ==================================================================================
-- PART 3: BUG REPORTS AND SUPPORT
-- ==================================================================================

-- ===== SECTION: create_bug_reports_table.sql - Bug Reports =====
CREATE TABLE IF NOT EXISTS bug_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    improvements TEXT,
    browser_info TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notification_shown BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE bug_reports ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can create bug reports" ON bug_reports;
CREATE POLICY "Users can create bug reports"
ON bug_reports FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view own reports" ON bug_reports;
CREATE POLICY "Users can view own reports"
ON bug_reports FOR SELECT
USING (auth.uid() = user_id);

-- ===== SECTION: create_support_chat_schema.sql - Support Chat System =====
CREATE TABLE IF NOT EXISTS support_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    user_name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    sender_name TEXT,
    sender_avatar TEXT,
    staff_profile_id TEXT,
    message TEXT NOT NULL,
    image_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- Add constraint (idempotent)
ALTER TABLE support_messages DROP CONSTRAINT IF EXISTS support_messages_sender_type_check;
ALTER TABLE support_messages
ADD CONSTRAINT support_messages_sender_type_check
CHECK (sender_type IN ('user', 'admin', 'staff'));

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_conversation_id ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_email ON support_messages(user_email);
CREATE INDEX IF NOT EXISTS idx_created_at ON support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON support_conversations(user_email);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_sender_type ON support_messages(sender_type);
CREATE INDEX IF NOT EXISTS idx_support_messages_image ON support_messages(image_url) WHERE image_url IS NOT NULL;

-- Disable RLS for testing
ALTER TABLE support_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages DISABLE ROW LEVEL SECURITY;

-- Grant access
GRANT ALL ON support_conversations TO authenticated;
GRANT ALL ON support_conversations TO anon;
GRANT ALL ON support_messages TO authenticated;
GRANT ALL ON support_messages TO anon;

-- Enable Realtime
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'support_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;
    END IF;

    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables
        WHERE pubname = 'supabase_realtime'
        AND tablename = 'support_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
    END IF;
END $$;

-- Function to update conversation last message
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_conversations
    SET
        last_message_at = NEW.created_at,
        unread_count = CASE
            WHEN NEW.sender_type = 'user' THEN unread_count + 1
            ELSE 0
        END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_update_last_message ON support_messages;
CREATE TRIGGER trigger_update_last_message
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Function to auto-delete old image URLs
CREATE OR REPLACE FUNCTION auto_delete_old_images()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    IF NEW.image_url IS NOT NULL THEN
        UPDATE support_messages
        SET image_url = NULL
        WHERE image_url IS NOT NULL
          AND created_at < NOW() - INTERVAL '24 hours';
    END IF;
    RETURN NEW;
END;
$$;

-- Trigger for auto-delete images
DROP TRIGGER IF EXISTS trigger_auto_delete_old_images ON support_messages;
CREATE TRIGGER trigger_auto_delete_old_images
    AFTER INSERT ON support_messages
    FOR EACH ROW
    EXECUTE FUNCTION auto_delete_old_images();

-- Manual cleanup function
CREATE OR REPLACE FUNCTION cleanup_old_image_urls()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    WITH deleted AS (
        UPDATE support_messages
        SET image_url = NULL
        WHERE image_url IS NOT NULL
          AND created_at < NOW() - INTERVAL '24 hours'
        RETURNING id
    )
    SELECT COUNT(*) INTO deleted_count FROM deleted;
    RETURN deleted_count;
END;
$$;

-- ==================================================================================
-- PART 4: COMMENTS AND RATINGS
-- ==================================================================================

-- ===== SECTION: commentsystem.sql - Guide Comments =====
CREATE TABLE IF NOT EXISTS guide_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guide_id BIGINT REFERENCES guides(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES guide_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE guide_comments ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Everyone can view comments" ON guide_comments;
CREATE POLICY "Everyone can view comments"
ON guide_comments FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Authenticated users can insert comments" ON guide_comments;
CREATE POLICY "Authenticated users can insert comments"
ON guide_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own comments" ON guide_comments;
CREATE POLICY "Users can update their own comments"
ON guide_comments FOR UPDATE
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON guide_comments;
CREATE POLICY "Users can delete their own comments"
ON guide_comments FOR DELETE
USING (auth.uid() = user_id);

-- View for comments with profile info
DROP VIEW IF EXISTS guide_comments_with_profiles;
CREATE OR REPLACE VIEW guide_comments_with_profiles WITH (security_invoker = true) AS
SELECT
    bg.id,
    bg.guide_id,
    bg.user_id,
    bg.parent_id,
    bg.content,
    bg.created_at,
    bg.updated_at,
    p.user_email,
    p.avatar_url,
    coalesce(p.account_type, 'individual') as account_type
FROM
    guide_comments bg
LEFT JOIN
    zetsuguide_user_profiles p ON bg.user_id = p.user_id;

-- ===== SECTION: rating.sql - Guide Ratings =====
CREATE TABLE IF NOT EXISTS guide_ratings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id BIGINT REFERENCES guides(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  rating NUMERIC NOT NULL CHECK (rating >= 0.5 and rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(guide_id, user_id)
);

-- Enable RLS
ALTER TABLE guide_ratings ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Anyone can view ratings" ON guide_ratings;
CREATE POLICY "Anyone can view ratings"
  ON guide_ratings FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Authenticated users can create ratings" ON guide_ratings;
CREATE POLICY "Authenticated users can create ratings"
  ON guide_ratings FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own ratings" ON guide_ratings;
CREATE POLICY "Users can update their own ratings"
  ON guide_ratings FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own ratings" ON guide_ratings;
CREATE POLICY "Users can delete their own ratings"
  ON guide_ratings FOR DELETE
  USING (auth.uid() = user_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS guide_ratings_guide_id_idx ON guide_ratings(guide_id);
CREATE INDEX IF NOT EXISTS guide_ratings_user_id_idx ON guide_ratings(user_id);

-- ===== SECTION: inline-comments.sql - Inline Comments on Guide Text =====
CREATE TABLE IF NOT EXISTS guide_inline_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guide_id BIGINT NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    selected_text TEXT NOT NULL,
    comment TEXT NOT NULL,
    position_json JSONB DEFAULT '{"left":0,"top":0}'::jsonb,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE guide_inline_comments ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view inline comments" ON guide_inline_comments;
CREATE POLICY "Anyone can view inline comments"
    ON guide_inline_comments FOR SELECT
    USING (true);

DROP POLICY IF EXISTS "Users can create inline comments" ON guide_inline_comments;
CREATE POLICY "Users can create inline comments"
    ON guide_inline_comments FOR INSERT
    WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their inline comments" ON guide_inline_comments;
CREATE POLICY "Users can update their inline comments"
    ON guide_inline_comments FOR UPDATE
    USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their inline comments" ON guide_inline_comments;
CREATE POLICY "Users can delete their inline comments"
    ON guide_inline_comments FOR DELETE
    USING (auth.uid() = user_id);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_inline_comments_guide_id ON guide_inline_comments(guide_id);
CREATE INDEX IF NOT EXISTS idx_inline_comments_user_id ON guide_inline_comments(user_id);

-- ==================================================================================
-- PART 5: CHAT AND CHATBOT
-- ==================================================================================

-- ===== SECTION: chat-history-table.sql - Conversations =====
CREATE TABLE IF NOT EXISTS zetsuguide_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_conversations_user_email ON zetsuguide_conversations(user_email);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON zetsuguide_conversations(updated_at DESC);

-- Enable RLS
ALTER TABLE zetsuguide_conversations ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own conversations" ON zetsuguide_conversations;
CREATE POLICY "Users can view own conversations" ON zetsuguide_conversations
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert own conversations" ON zetsuguide_conversations;
CREATE POLICY "Users can insert own conversations" ON zetsuguide_conversations
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Users can update own conversations" ON zetsuguide_conversations;
CREATE POLICY "Users can update own conversations" ON zetsuguide_conversations
    FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Users can delete own conversations" ON zetsuguide_conversations;
CREATE POLICY "Users can delete own conversations" ON zetsuguide_conversations
    FOR DELETE USING (true);

-- ===== SECTION: chatbot_usage.sql - Chatbot Token Tracking =====
CREATE TABLE IF NOT EXISTS user_chatbot_usage (
  user_id UUID REFERENCES auth.users NOT NULL PRIMARY KEY,
  tokens_left INT DEFAULT 3,
  last_reset_at TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE user_chatbot_usage ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own usage" ON user_chatbot_usage;
CREATE POLICY "Users can view their own usage"
  ON user_chatbot_usage FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own usage" ON user_chatbot_usage;
CREATE POLICY "Users can insert their own usage"
  ON user_chatbot_usage FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own usage" ON user_chatbot_usage;
CREATE POLICY "Users can update their own usage"
  ON user_chatbot_usage FOR UPDATE
  USING (auth.uid() = user_id);

-- ==================================================================================
-- PART 6: VIEW TRACKING AND TIME TRACKING
-- ==================================================================================

-- ===== SECTION: guide_views_table.sql - Guide Views =====
CREATE TABLE IF NOT EXISTS guide_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  guide_id INTEGER NOT NULL REFERENCES guides(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  session_id TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create IMMUTABLE function
CREATE OR REPLACE FUNCTION timestamp_to_date(ts TIMESTAMP WITH TIME ZONE)
RETURNS DATE AS $$
BEGIN
  RETURN (ts AT TIME ZONE 'UTC')::DATE;
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Clean up duplicate views before creating indexes
DELETE FROM guide_views
WHERE id NOT IN (
  SELECT DISTINCT ON (guide_id, user_id, timestamp_to_date(created_at))
    id
  FROM guide_views
  WHERE user_id IS NOT NULL
  ORDER BY guide_id, user_id, timestamp_to_date(created_at), created_at ASC
);

DELETE FROM guide_views
WHERE id NOT IN (
  SELECT DISTINCT ON (guide_id, session_id, timestamp_to_date(created_at))
    id
  FROM guide_views
  WHERE session_id IS NOT NULL AND user_id IS NULL
  ORDER BY guide_id, session_id, timestamp_to_date(created_at), created_at ASC
);

-- Create unique indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_view_user_guide
  ON guide_views(guide_id, user_id, timestamp_to_date(created_at))
  WHERE user_id IS NOT NULL;

CREATE UNIQUE INDEX IF NOT EXISTS idx_unique_view_session_guide
  ON guide_views(guide_id, session_id, timestamp_to_date(created_at))
  WHERE session_id IS NOT NULL AND user_id IS NULL;

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_guide_views_guide_id ON guide_views(guide_id);
CREATE INDEX IF NOT EXISTS idx_guide_views_created_at ON guide_views(created_at);
CREATE INDEX IF NOT EXISTS idx_guide_views_user_id ON guide_views(user_id);

-- Function to increment views
CREATE OR REPLACE FUNCTION increment_guide_views()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE guides
  SET views_count = views_count + 1
  WHERE id = NEW.guide_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger
DROP TRIGGER IF EXISTS trigger_increment_guide_views ON guide_views;
CREATE TRIGGER trigger_increment_guide_views
  AFTER INSERT ON guide_views
  FOR EACH ROW
  EXECUTE FUNCTION increment_guide_views();

-- Enable RLS
ALTER TABLE guide_views ENABLE ROW LEVEL SECURITY;

-- Function to check if user is not the author
CREATE OR REPLACE FUNCTION is_not_guide_author(p_guide_id INTEGER, p_user_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
  IF p_user_id IS NULL THEN
    RETURN TRUE;
  END IF;

  RETURN NOT EXISTS (
    SELECT 1 FROM guides
    WHERE id = p_guide_id
    AND author_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies
DROP POLICY IF EXISTS "Non-authors can insert views" ON guide_views;
CREATE POLICY "Non-authors can insert views"
  ON guide_views
  FOR INSERT
  WITH CHECK (is_not_guide_author(guide_id, user_id));

DROP POLICY IF EXISTS "Anyone can view views" ON guide_views;
CREATE POLICY "Anyone can view views"
  ON guide_views
  FOR SELECT
  USING (true);

-- Grant permissions
GRANT ALL ON guide_views TO authenticated;
GRANT ALL ON guide_views TO anon;

-- ===== SECTION: track_time_spent.sql - Time Tracking =====
CREATE TABLE IF NOT EXISTS guide_time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guide_id BIGINT REFERENCES guides(id) ON DELETE CASCADE,
    duration_seconds INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, guide_id)
);

-- Enable RLS
ALTER TABLE guide_time_logs ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view own time logs" ON guide_time_logs;
CREATE POLICY "Users can view own time logs"
ON guide_time_logs FOR SELECT
USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert own time logs" ON guide_time_logs;
CREATE POLICY "Users can insert own time logs"
ON guide_time_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own time logs" ON guide_time_logs;
CREATE POLICY "Users can update own time logs"
ON guide_time_logs FOR UPDATE
USING (auth.uid() = user_id);

-- Function to track guide time
CREATE OR REPLACE FUNCTION track_guide_time(
    p_guide_id BIGINT,
    p_duration_add INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO guide_time_logs (user_id, guide_id, duration_seconds)
    VALUES (auth.uid(), p_guide_id, p_duration_add)
    ON CONFLICT (user_id, guide_id)
    DO UPDATE SET
        duration_seconds = guide_time_logs.duration_seconds + EXCLUDED.duration_seconds,
        last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================================================
-- PART 7: CREDITS AND TASKS
-- ==================================================================================

-- ===== SECTION: daily_credits.sql - Daily Credits System =====
-- Add column to zetsuguide_credits (already done above, but adding function here)

-- Function to claim daily credits
CREATE OR REPLACE FUNCTION claim_daily_credits(p_user_email TEXT)
RETURNS TABLE(success BOOLEAN, message TEXT, credits_awarded INTEGER, new_balance INTEGER) AS $$
DECLARE
    current_credits INTEGER;
    last_claim TIMESTAMP WITH TIME ZONE;
    credits_to_award INTEGER;
BEGIN
    SELECT credits, last_daily_claim INTO current_credits, last_claim
    FROM zetsuguide_credits
    WHERE user_email = LOWER(p_user_email);

    IF NOT FOUND THEN
        RETURN QUERY SELECT false, 'User not found'::TEXT, 0, 0;
        RETURN;
    END IF;

    IF last_claim IS NOT NULL AND NOW() < last_claim + INTERVAL '24 hours' THEN
        RETURN QUERY SELECT false, 'Daily credits already claimed'::TEXT, 0, current_credits;
        RETURN;
    END IF;

    credits_to_award := FLOOR(RANDOM() * 5) + 1;

    UPDATE zetsuguide_credits
    SET
        credits = credits + credits_to_award,
        last_daily_claim = NOW(),
        updated_at = NOW()
    WHERE user_email = LOWER(p_user_email);

    RETURN QUERY SELECT true, 'Daily credits claimed successfully!'::TEXT, credits_to_award, current_credits + credits_to_award;
END;
$$ LANGUAGE plpgsql;

-- Function to check if user can claim daily credits
CREATE OR REPLACE FUNCTION can_claim_daily_credits(p_user_email TEXT)
RETURNS TABLE(can_claim BOOLEAN, hours_remaining DOUBLE PRECISION) AS $$
DECLARE
    last_claim TIMESTAMP WITH TIME ZONE;
    remaining_hours DOUBLE PRECISION;
BEGIN
    SELECT last_daily_claim INTO last_claim
    FROM zetsuguide_credits
    WHERE user_email = LOWER(p_user_email);

    IF NOT FOUND OR last_claim IS NULL THEN
        RETURN QUERY SELECT true::BOOLEAN, 0.0::DOUBLE PRECISION;
        RETURN;
    END IF;

    IF NOW() >= last_claim + INTERVAL '24 hours' THEN
        RETURN QUERY SELECT true::BOOLEAN, 0.0::DOUBLE PRECISION;
    ELSE
        remaining_hours := (EXTRACT(EPOCH FROM (last_claim + INTERVAL '24 hours' - NOW())) / 3600)::DOUBLE PRECISION;
        RETURN QUERY SELECT false::BOOLEAN, remaining_hours;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- ===== SECTION: deduct_credits_rpc.sql - Credit Deduction =====
-- RPC function for credit deduction
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
  SELECT credits, reserved_credits
  INTO current_credits, current_reserved
  FROM zetsuguide_credits
  WHERE user_email = user_email_param;

  IF current_credits IS NULL THEN
    RETURN QUERY SELECT false, 0, 'User not found'::TEXT;
    RETURN;
  END IF;

  available_credits := current_credits - current_reserved;

  IF available_credits < amount_param THEN
    RETURN QUERY SELECT false, current_credits, 'Insufficient credits'::TEXT;
    RETURN;
  END IF;

  new_credits := current_credits - amount_param;

  UPDATE zetsuguide_credits
  SET
    credits = new_credits,
    updated_at = NOW()
  WHERE user_email = user_email_param;

  RETURN QUERY SELECT true, new_credits, 'Credits deducted successfully'::TEXT;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions
GRANT EXECUTE ON FUNCTION deduct_credits(TEXT, INTEGER) TO authenticated;
GRANT EXECUTE ON FUNCTION deduct_credits(TEXT, INTEGER) TO anon;

-- ===== SECTION: supabase_migration_credit_reservation.sql - Credit Reservation =====
-- Helper function to reserve credits
CREATE OR REPLACE FUNCTION reserve_credit(user_email_param TEXT)
RETURNS TABLE(success BOOLEAN, remaining_credits INTEGER, reserved INTEGER) AS $$
DECLARE
    current_credits INTEGER;
    current_reserved INTEGER;
BEGIN
    SELECT credits, reserved_credits INTO current_credits, current_reserved
    FROM zetsuguide_credits
    WHERE user_email = LOWER(user_email_param)
    FOR UPDATE;

    IF (current_credits - current_reserved) < 1 THEN
        RETURN QUERY SELECT FALSE, current_credits, current_reserved;
        RETURN;
    END IF;

    UPDATE zetsuguide_credits
    SET reserved_credits = reserved_credits + 1,
        updated_at = NOW()
    WHERE user_email = LOWER(user_email_param);

    RETURN QUERY SELECT TRUE, current_credits, current_reserved + 1;
END;
$$ LANGUAGE plpgsql;

-- Helper function to commit reserved credit
CREATE OR REPLACE FUNCTION commit_reserved_credit(user_email_param TEXT)
RETURNS TABLE(success BOOLEAN, new_balance INTEGER) AS $$
DECLARE
    current_credits INTEGER;
    current_reserved INTEGER;
BEGIN
    SELECT credits, reserved_credits INTO current_credits, current_reserved
    FROM zetsuguide_credits
    WHERE user_email = LOWER(user_email_param)
    FOR UPDATE;

    IF current_reserved < 1 THEN
        RETURN QUERY SELECT FALSE, current_credits;
        RETURN;
    END IF;

    UPDATE zetsuguide_credits
    SET credits = credits - 1,
        reserved_credits = reserved_credits - 1,
        updated_at = NOW()
    WHERE user_email = LOWER(user_email_param);

    RETURN QUERY SELECT TRUE, current_credits - 1;
END;
$$ LANGUAGE plpgsql;

-- Helper function to release reserved credit
CREATE OR REPLACE FUNCTION release_reserved_credit(user_email_param TEXT)
RETURNS TABLE(success BOOLEAN, credits_remaining INTEGER) AS $$
DECLARE
    current_credits INTEGER;
    current_reserved INTEGER;
BEGIN
    SELECT credits, reserved_credits INTO current_credits, current_reserved
    FROM zetsuguide_credits
    WHERE user_email = LOWER(user_email_param)
    FOR UPDATE;

    IF current_reserved < 1 THEN
        RETURN QUERY SELECT FALSE, current_credits;
        RETURN;
    END IF;

    UPDATE zetsuguide_credits
    SET reserved_credits = reserved_credits - 1,
        updated_at = NOW()
    WHERE user_email = LOWER(user_email_param);

    RETURN QUERY SELECT TRUE, current_credits;
END;
$$ LANGUAGE plpgsql;

-- ===== SECTION: secure_claim_task_v2.sql - Task Reward Claiming =====
CREATE TABLE IF NOT EXISTS claimed_rewards (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id),
    task_id TEXT NOT NULL,
    claim_key TEXT NOT NULL UNIQUE,
    amount INT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Function to claim task reward with verification
CREATE OR REPLACE FUNCTION claim_task_reward(
  task_id TEXT,
  user_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  reward_amount INT;
  current_credits INT;
  already_claimed BOOLEAN;
  claim_key TEXT;
  is_verified BOOLEAN;
  verification_msg TEXT;
BEGIN
  -- Define Rewards
  IF task_id = 'focus_reader' THEN
    reward_amount := 10;
  ELSIF task_id = 'bug_hunter' THEN
    reward_amount := 10;
  ELSIF task_id = 'daily_login' THEN
    reward_amount := 5;
  ELSE
    RETURN json_build_object('success', FALSE, 'message', 'Invalid task ID');
  END IF;

  -- Define Claim Key
  IF task_id = 'daily_login' THEN
    claim_key := 'claim_' || task_id || '_' || user_id || '_' || to_char(NOW(), 'YYYY-MM-DD');
  ELSE
    claim_key := 'claim_' || task_id || '_' || user_id || '_' || to_char(NOW(), 'YYYY-MM');
  END IF;

  -- Check if already claimed
  SELECT EXISTS(SELECT 1 FROM claimed_rewards WHERE claimed_rewards.claim_key = claim_task_reward.claim_key) INTO already_claimed;

  IF already_claimed THEN
    RETURN json_build_object('success', FALSE, 'message', 'Reward already claimed for this period', 'code', 'ALREADY_CLAIMED');
  END IF;

  -- SERVER-SIDE VERIFICATION
  is_verified := FALSE;

  IF task_id = 'focus_reader' THEN
     SELECT EXISTS (
       SELECT 1 FROM guide_time_logs
       WHERE guide_time_logs.user_id = claim_task_reward.user_id
       AND guide_time_logs.duration_seconds >= 300
     ) INTO is_verified;
     verification_msg := 'You need to read a guide for at least 5 minutes.';

  ELSIF task_id = 'bug_hunter' THEN
     SELECT EXISTS (
       SELECT 1 FROM bug_reports
       WHERE bug_reports.user_id = claim_task_reward.user_id
     ) INTO is_verified;
     verification_msg := 'You need to submit a bug report first.';

  ELSIF task_id = 'daily_login' THEN
     is_verified := TRUE;
  END IF;

  IF NOT is_verified THEN
     RETURN json_build_object('success', FALSE, 'message', verification_msg, 'code', 'REQUIREMENT_NOT_MET');
  END IF;

  -- Award Reward
  BEGIN
      INSERT INTO claimed_rewards (user_id, task_id, claim_key, amount)
      VALUES (user_id, task_id, claim_key, reward_amount);

      UPDATE zetsuguide_credits
      SET credits = COALESCE(credits, 0) + reward_amount,
          updated_at = NOW()
      WHERE zetsuguide_credits.user_id = claim_task_reward.user_id
         OR zetsuguide_credits.user_email = (SELECT email FROM auth.users WHERE id = claim_task_reward.user_id);

      IF NOT FOUND THEN
          INSERT INTO zetsuguide_credits (user_id, user_email, credits)
          SELECT claim_task_reward.user_id, email, reward_amount
          FROM auth.users WHERE id = claim_task_reward.user_id;
      END IF;

      SELECT credits INTO current_credits FROM zetsuguide_credits
      WHERE zetsuguide_credits.user_id = claim_task_reward.user_id
         OR zetsuguide_credits.user_email = (SELECT email FROM auth.users WHERE id = claim_task_reward.user_id);

      RETURN json_build_object('success', TRUE, 'new_balance', current_credits, 'reward', reward_amount);

  EXCEPTION WHEN unique_violation THEN
      RETURN json_build_object('success', FALSE, 'message', 'Reward already claimed (concurrency)', 'code', 'ALREADY_CLAIMED');
  END;
END;
$$;

-- ==================================================================================
-- PART 8: FOLLOW SYSTEM
-- ==================================================================================

-- ===== SECTION: setup_follow_system.sql - Follow System =====
CREATE TABLE IF NOT EXISTS user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_email TEXT NOT NULL,
  following_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_emails ON user_follows(follower_email, following_email);

-- Enable RLS
ALTER TABLE user_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DROP POLICY IF EXISTS "Anyone can view follows" ON user_follows;
CREATE POLICY "Anyone can view follows" ON user_follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON user_follows;
CREATE POLICY "Users can follow others" ON user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON user_follows;
CREATE POLICY "Users can unfollow" ON user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- Trigger function to update follower counts on new follow
CREATE OR REPLACE FUNCTION handle_new_follow()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE zetsuguide_user_profiles
  SET following_count = following_count + 1
  WHERE user_id = NEW.follower_id;

  UPDATE zetsuguide_user_profiles
  SET followers_count = followers_count + 1
  WHERE user_id = NEW.following_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_user_follow_added ON user_follows;
CREATE TRIGGER on_user_follow_added
  AFTER INSERT ON user_follows
  FOR EACH ROW EXECUTE FUNCTION handle_new_follow();

-- Trigger function to update follower counts on unfollow
CREATE OR REPLACE FUNCTION handle_unfollow()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE zetsuguide_user_profiles
  SET following_count = GREATEST(0, following_count - 1)
  WHERE user_id = OLD.follower_id;

  UPDATE zetsuguide_user_profiles
  SET followers_count = GREATEST(0, followers_count - 1)
  WHERE user_id = OLD.following_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger
DROP TRIGGER IF EXISTS on_user_unfollow ON user_follows;
CREATE TRIGGER on_user_unfollow
  AFTER DELETE ON user_follows
  FOR EACH ROW EXECUTE FUNCTION handle_unfollow();

-- Function to check if user A follows user B
CREATE OR REPLACE FUNCTION is_following(
  follower_user_id UUID,
  following_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM user_follows
    WHERE follower_id = follower_user_id
    AND following_id = following_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get follower count by user_id
CREATE OR REPLACE FUNCTION get_followers_count(target_user_id UUID)
RETURNS INT AS $$
DECLARE
  count_result INT;
BEGIN
  SELECT COALESCE(followers_count, 0) INTO count_result
  FROM zetsuguide_user_profiles
  WHERE user_id = target_user_id;

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get follower count by email
CREATE OR REPLACE FUNCTION get_followers_count_by_email(target_email TEXT)
RETURNS INT AS $$
DECLARE
  count_result INT;
BEGIN
  SELECT COALESCE(followers_count, 0) INTO count_result
  FROM zetsuguide_user_profiles
  WHERE user_email = target_email;

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get following count by email
CREATE OR REPLACE FUNCTION get_following_count_by_email(target_email TEXT)
RETURNS INT AS $$
DECLARE
  count_result INT;
BEGIN
  SELECT COALESCE(following_count, 0) INTO count_result
  FROM zetsuguide_user_profiles
  WHERE user_email = target_email;

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to recalculate all follower counts
CREATE OR REPLACE FUNCTION recalculate_follower_counts()
RETURNS VOID AS $$
BEGIN
  UPDATE zetsuguide_user_profiles
  SET followers_count = 0, following_count = 0;

  UPDATE zetsuguide_user_profiles p
  SET following_count = (
    SELECT COUNT(*)
    FROM user_follows f
    WHERE f.follower_id = p.user_id
  );

  UPDATE zetsuguide_user_profiles p
  SET followers_count = (
    SELECT COUNT(*)
    FROM user_follows f
    WHERE f.following_id = p.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==================================================================================
-- PART 9: COMMUNITY SYSTEM
-- ==================================================================================

-- ===== SECTION: 20260213_create_community_posts.sql - Community Posts =====
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT CHECK (category IN ('Help', 'Showcase', 'General')) DEFAULT 'General',
    likes_count INT DEFAULT 0,
    views_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Fix: Add group_id to posts for community grouping
ALTER TABLE posts ADD COLUMN IF NOT EXISTS group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE;

-- views_count is already defined in CREATE TABLE above, no need to add it again here

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);
CREATE INDEX IF NOT EXISTS idx_posts_group_id ON posts(group_id);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public posts are viewable by everyone." ON posts;
CREATE POLICY "Public posts are viewable by everyone." ON posts
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create posts" ON posts;
CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can update own posts" ON posts;
CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete own posts" ON posts;
CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);

-- ===== SECTION: 20260213_community_interactions.sql - Comments and Likes =====
CREATE TABLE IF NOT EXISTS post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for comments
ALTER TABLE post_comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON post_comments;
CREATE POLICY "Public comments are viewable by everyone" ON post_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON post_comments;
CREATE POLICY "Users can create comments" ON post_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own comments" ON post_comments;
CREATE POLICY "Users can delete own comments" ON post_comments
    FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS post_likes (
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- Enable RLS for likes
ALTER TABLE post_likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
DROP POLICY IF EXISTS "Public likes are viewable by everyone" ON post_likes;
CREATE POLICY "Public likes are viewable by everyone" ON post_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert likes" ON post_likes;
CREATE POLICY "Users can insert likes" ON post_likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete likes" ON post_likes;
CREATE POLICY "Users can delete likes" ON post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- ===== SECTION: 20260213_likes_rpc.sql - Like Functions =====
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- ===== SECTION: community_hashtag_trigger.sql - Hashtag System =====
CREATE TABLE IF NOT EXISTS community_hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tag TEXT UNIQUE NOT NULL,
    usage_count INT DEFAULT 1,
    last_used_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS community_post_hashtags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    hashtag_id UUID REFERENCES community_hashtags(id) ON DELETE CASCADE,
    UNIQUE(post_id, hashtag_id)
);

-- Function to extract hashtags from a new post
CREATE OR REPLACE FUNCTION extract_hashtags_from_post()
RETURNS TRIGGER AS $$
DECLARE
  hashtag_match TEXT;
  hashtag_record UUID;
BEGIN
  FOR hashtag_match IN
    SELECT DISTINCT LOWER(m[1])
    FROM regexp_matches(NEW.content, '#([A-Za-z0-9_\u0600-\u06FF]{2,30})', 'g') AS m
  LOOP
    INSERT INTO community_hashtags (tag, usage_count, last_used_at)
    VALUES (hashtag_match, 1, NOW())
    ON CONFLICT (tag) DO UPDATE
      SET usage_count = community_hashtags.usage_count + 1,
          last_used_at = NOW()
    RETURNING id INTO hashtag_record;

    INSERT INTO community_post_hashtags (post_id, hashtag_id)
    VALUES (NEW.id, hashtag_record)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger on posts table
DROP TRIGGER IF EXISTS trg_extract_hashtags ON posts;
CREATE TRIGGER trg_extract_hashtags
  AFTER INSERT ON posts
  FOR EACH ROW
  EXECUTE FUNCTION extract_hashtags_from_post();

-- Function to decrement hashtag counts when a post is deleted
CREATE OR REPLACE FUNCTION decrement_hashtags_on_post_delete()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE community_hashtags
  SET usage_count = GREATEST(usage_count - 1, 0)
  WHERE id IN (
    SELECT hashtag_id FROM community_post_hashtags WHERE post_id = OLD.id
  );

  DELETE FROM community_hashtags WHERE usage_count <= 0;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create delete trigger
DROP TRIGGER IF EXISTS trg_decrement_hashtags ON posts;
CREATE TRIGGER trg_decrement_hashtags
  BEFORE DELETE ON posts
  FOR EACH ROW
  EXECUTE FUNCTION decrement_hashtags_on_post_delete();

-- Backfill: Extract hashtags from existing posts (run once)
DO $$
DECLARE
  post_record RECORD;
  hashtag_match TEXT;
  hashtag_record UUID;
BEGIN
  FOR post_record IN SELECT id, content FROM posts LOOP
    FOR hashtag_match IN
      SELECT DISTINCT LOWER(m[1])
      FROM regexp_matches(post_record.content, '#([A-Za-z0-9_\u0600-\u06FF]{2,30})', 'g') AS m
    LOOP
      INSERT INTO community_hashtags (tag, usage_count, last_used_at)
      VALUES (hashtag_match, 1, NOW())
      ON CONFLICT (tag) DO UPDATE
        SET usage_count = community_hashtags.usage_count + 1,
            last_used_at = NOW()
      RETURNING id INTO hashtag_record;

      INSERT INTO community_post_hashtags (post_id, hashtag_id)
      VALUES (post_record.id, hashtag_record)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ==================================================================================
-- PART 10: GUIDE VERSIONING AND METADATA
-- ==================================================================================

-- ===== SECTION: 20260213_setup_guide_versions.sql - Guide Versions =====
CREATE TABLE IF NOT EXISTS guide_versions (
    id BIGINT GENERATED BY DEFAULT AS IDENTITY PRIMARY KEY,
    guide_id BIGINT REFERENCES guides(id) ON DELETE CASCADE,
    title TEXT,
    content TEXT,
    html_content TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add index
CREATE INDEX IF NOT EXISTS idx_guide_versions_guide_id ON guide_versions(guide_id);

-- Enable RLS
ALTER TABLE guide_versions ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON guide_versions;
CREATE POLICY "Public profiles are viewable by everyone." ON guide_versions
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert versions for their guides" ON guide_versions;
CREATE POLICY "Users can insert versions for their guides" ON guide_versions
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- ===== SECTION: MIGRATION_001_add_author_system.sql - Author Columns (Already Included) =====
-- Author columns were already added to guides table above

-- ===== SECTION: add_author_fields_to_guides.sql - Additional Author Setup =====
-- Additional indexes already created above

-- ===== SECTION: add_bio_column.sql - Bio Column (Already Included) =====
-- Bio column already added to zetsuguide_user_profiles above

-- ===== SECTION: add_image_support.sql - Image Support =====
-- Image support already added to support_messages above with auto-delete function

-- ===== SECTION: add_onboarding_flag.sql - Onboarding Flag (Already Included) =====
-- Onboarding flag already added to zetsuguide_user_profiles above

-- ===== SECTION: add_status_column.sql - Guide Status (Already Included) =====
-- Status columns already added to guides table above

-- ===== SECTION: badge_migration.sql - Follower Count Function =====
-- Follower count functions already created above in follow system

-- ==================================================================================
-- FINAL VERIFICATION AND SUMMARY
-- ==================================================================================

-- Summary message
SELECT 'ZETSUSAVE COMPLETE DATABASE SCHEMA SUCCESSFULLY DEPLOYED' as status;

-- Grant permissions summary
GRANT EXECUTE ON FUNCTION record_guide_interaction TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_personalized_recommendations TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_trending_guides TO authenticated, anon;
GRANT EXECUTE ON FUNCTION deduct_credits TO authenticated, anon;
GRANT EXECUTE ON FUNCTION reserve_credit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION commit_reserved_credit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION release_reserved_credit TO authenticated, anon;
GRANT EXECUTE ON FUNCTION claim_task_reward TO authenticated, anon;
GRANT EXECUTE ON FUNCTION claim_daily_credits TO authenticated, anon;
GRANT EXECUTE ON FUNCTION can_claim_daily_credits TO authenticated, anon;
GRANT EXECUTE ON FUNCTION track_guide_time TO authenticated, anon;
GRANT EXECUTE ON FUNCTION is_following TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_followers_count TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_followers_count_by_email TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_following_count_by_email TO authenticated, anon;
GRANT EXECUTE ON FUNCTION recalculate_follower_counts TO authenticated, anon;

-- Grants for zetsuguide_user_profiles table
GRANT SELECT ON TABLE zetsuguide_user_profiles TO authenticated, anon;
GRANT INSERT ON TABLE zetsuguide_user_profiles TO authenticated;
GRANT UPDATE ON TABLE zetsuguide_user_profiles TO authenticated;

-- Grants for user_follows table
GRANT SELECT ON TABLE user_follows TO authenticated, anon;
GRANT INSERT ON TABLE user_follows TO authenticated;
GRANT UPDATE ON TABLE user_follows TO authenticated;
GRANT DELETE ON TABLE user_follows TO authenticated;

GRANT EXECUTE ON FUNCTION increment_likes TO authenticated, anon;
GRANT EXECUTE ON FUNCTION decrement_likes TO authenticated, anon;
GRANT EXECUTE ON FUNCTION cleanup_old_image_urls TO authenticated, anon;

-- ==================================================================================
-- PART 11: COMMUNITY V2 (BOOKMARKS, NOTIFICATIONS, GROUPS)
-- ==================================================================================

-- ===== Bookmarks =====
CREATE TABLE IF NOT EXISTS post_bookmarks (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, post_id)
);

ALTER TABLE post_bookmarks ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own bookmarks" ON post_bookmarks;
CREATE POLICY "Users can view own bookmarks" ON post_bookmarks
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can manage own bookmarks" ON post_bookmarks;
CREATE POLICY "Users can manage own bookmarks" ON post_bookmarks
    FOR ALL USING (auth.uid() = user_id);

-- ===== Notifications =====
CREATE TABLE IF NOT EXISTS community_notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Who receives
    actor_id UUID REFERENCES auth.users(id) ON DELETE CASCADE, -- Who did it
    type TEXT CHECK (type IN ('like', 'comment', 'follow', 'mention')) NOT NULL,
    post_id UUID REFERENCES posts(id) ON DELETE CASCADE, -- Optional relation to post
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

ALTER TABLE community_notifications ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own notifications" ON community_notifications;
CREATE POLICY "Users can view own notifications" ON community_notifications
    FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update own notifications" ON community_notifications;
CREATE POLICY "Users can update own notifications" ON community_notifications
    FOR UPDATE USING (auth.uid() = user_id);

-- Trigger to create notification on post like
CREATE OR REPLACE FUNCTION notify_post_like() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO community_notifications (user_id, actor_id, type, post_id)
    VALUES ((SELECT user_id FROM posts WHERE id = NEW.post_id), NEW.user_id, 'like', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_post_like ON post_likes;
CREATE TRIGGER trg_notify_post_like AFTER INSERT ON post_likes
FOR EACH ROW EXECUTE FUNCTION notify_post_like();

-- Trigger to create notification on post comment
CREATE OR REPLACE FUNCTION notify_post_comment() RETURNS TRIGGER AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO community_notifications (user_id, actor_id, type, post_id)
    VALUES ((SELECT user_id FROM posts WHERE id = NEW.post_id), NEW.user_id, 'comment', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_notify_post_comment ON post_comments;
CREATE TRIGGER trg_notify_post_comment AFTER INSERT ON post_comments
FOR EACH ROW EXECUTE FUNCTION notify_post_comment();

-- function to get unread notification count
CREATE OR REPLACE FUNCTION get_unread_notification_count(p_user_id UUID)
RETURNS INT AS $$
DECLARE
  unread_count INT;
BEGIN
  SELECT COUNT(*) INTO unread_count FROM community_notifications WHERE user_id = p_user_id AND is_read = FALSE;
  RETURN unread_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- EdgeRank Smart Feed View
-- ===== Communities (Groups) =====
CREATE TABLE IF NOT EXISTS community_groups (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name TEXT NOT NULL UNIQUE,
    description TEXT,
    avatar_url TEXT,
    banner_url TEXT,
    creator_id UUID REFERENCES auth.users(id),
    members_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Ensure creator_id exists (in case table was created before this column was added)
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS members_count INT DEFAULT 0;


-- community_members table
CREATE TABLE IF NOT EXISTS community_members (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, group_id)
);

-- Function to sync all member counts (run once or as needed)
CREATE OR REPLACE FUNCTION sync_community_member_counts() RETURNS void AS $$
BEGIN
  UPDATE community_groups cg
  SET members_count = (
    SELECT count(*) FROM community_members cm WHERE cm.group_id = cg.id
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update member count
CREATE OR REPLACE FUNCTION update_community_member_count() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE community_groups SET members_count = members_count + 1 WHERE id = NEW.group_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE community_groups SET members_count = GREATEST(0, members_count - 1) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Run sync once to ensure data consistency
SELECT sync_community_member_counts();

DROP TRIGGER IF EXISTS trg_community_member_count ON community_members;
CREATE TRIGGER trg_community_member_count
AFTER INSERT OR DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- RLS
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view groups" ON community_groups;
CREATE POLICY "Anyone can view groups" ON community_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can create groups" ON community_groups;
CREATE POLICY "Auth users can create groups" ON community_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Creators can delete their own groups" ON community_groups;
CREATE POLICY "Creators can delete their own groups" ON community_groups FOR DELETE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Anyone can view members" ON community_members;
CREATE POLICY "Anyone can view members" ON community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own membership" ON community_members;
CREATE POLICY "Users can manage own membership" ON community_members FOR ALL USING (auth.uid() = user_id);

-- Ensure columns exist in case table was created before this version
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS members_count INT DEFAULT 0;

-- (The seed data is now moved to the bottom DO $$ block to ensure users exist first)




-- ==================================================================================
-- DEPLOYMENT COMPLETE
-- ==================================================================================
-- All tables, functions, triggers, and RLS policies are now configured
-- Ready for production deployment to a new Supabase account
-- ==================================================================================

-- ==================================================================================
-- SEED DATA (MOCK CONTENT REPLACEMENT)
-- ==================================================================================
-- Inserting mock UI data required by the community feed to prevent JS fallbacks
-- Ensure auth constraints are bypassed for demonstration where necessary.

DO $$
DECLARE
  elon_id UUID := '11111111-1111-1111-1111-111111111111';
  sarah_id UUID := '22222222-2222-2222-2222-222222222222';
  james_id UUID := '33333333-3333-3333-3333-333333333333';
  design_id UUID := '44444444-4444-4444-4444-444444444444';
  news_id UUID := '55555555-5555-5555-5555-555555555555';
BEGIN
  -- Insert into auth.users if possible, otherwise rely on a test helper
  -- We use INSERT ... ON CONFLICT DO NOTHING to avoid breaking if users exist
  INSERT INTO auth.users (id, email, raw_user_meta_data) VALUES
  (elon_id, 'elon@x.com', '{"full_name":"Elon Musk"}'),
  (sarah_id, 'sarah@domain.com', '{"full_name":"Sarah Developer"}'),
  (james_id, 'james@domain.com', '{"full_name":"James Coder"}'),
  (design_id, 'uiux@domain.com', '{"full_name":"UI/UX Master"}'),
  (news_id, 'news@x.com', '{"full_name":"X News"}')
  ON CONFLICT (id) DO NOTHING;

  -- Insert profiles
  INSERT INTO zetsuguide_user_profiles (user_id, user_email, bio, avatar_url, followers_count, following_count) VALUES
  (elon_id, 'elon@x.com', 'Chief Twit', 'https://pbs.twimg.com/profile_images/1780044485541699584/p78MCn3B_400x400.jpg', 180000000, 150),
  (sarah_id, 'sarah@domain.com', 'React Dev', 'https://i.pravatar.cc/150?u=sarah', 1500, 300),
  (james_id, 'james@domain.com', 'Wandering logic', 'https://i.pravatar.cc/150?u=james', 800, 250),
  (design_id, 'uiux@domain.com', 'Making things pop', 'https://i.pravatar.cc/150?u=design', 25000, 10),
  (news_id, 'news@x.com', 'Official News', 'https://ui-avatars.com/api/?name=News', 5000, 0)
  ON CONFLICT (user_email) DO NOTHING;

  -- Insert Posts for Feed
  INSERT INTO posts (user_id, title, content, category, likes_count, created_at) VALUES
  (elon_id, 'Starship', 'Starship\n\n![Image](https://pbs.twimg.com/media/GK9bKxVW0AAPoJ2?format=jpg&name=large)', 'General', 452000, NOW() - INTERVAL '1 hour'),
  (sarah_id, 'Just shipped', 'Just shipped the new AI image generator for the marketplace! 🔥 The speed improvements using Cloudflare Workers are insane. What do you guys think? #buildinpublic #reactjs', 'General', 342, NOW() - INTERVAL '30 minutes'),
  (james_id, 'Refactoring', 'Refactoring a 5-year-old React codebase today. Wish me luck... 😅\n\n```typescript\n// The horror begins\ninterface UnknownProp { \n  [key: string]: any \n}\n```', 'General', 156, NOW() - INTERVAL '2 hours'),
  (design_id, 'Dark mode', 'Dark mode isn''t just a theme, it''s a lifestyle. 🌙 #webdesign #uiux', 'General', 1204, NOW() - INTERVAL '5 hours');

  -- Insert Posts for News
  INSERT INTO posts (user_id, title, content, category, likes_count, created_at) VALUES
  (news_id, 'Péter Magyar''s Tisza Party', 'Péter Magyar''s Tisza Party Wins Hungary Election Supermajority', 'News', 88480, NOW() - INTERVAL '1 day'),
  (news_id, 'U.S. Naval Blockade', 'U.S. Naval Blockade Targets Iranian Oil Exports After Talks Collapse', 'News', 8780, NOW() - INTERVAL '2 days'),
  (news_id, 'Barcelona Channels LeBron', 'Barcelona Channels LeBron''s 2016 Comeback for Atlético UCL Remontada', 'Sports', 3400, NOW() - INTERVAL '2 days');

  -- Insert Community Groups
  INSERT INTO community_groups (id, name, description, avatar_url, creator_id, members_count) VALUES
  ('66666666-6666-6666-6666-666666666666', 'Zetsu Developers', 'The hub for all things coding and Zetsu automation.', 'https://ui-avatars.com/api/?name=Zetsu+Devs&background=1d9bf0&color=fff', elon_id, 1250),
  ('77777777-7777-7777-7777-777777777777', 'Crypto Enthusiasts', 'Discussing latest trends in blockchain and web3.', 'https://ui-avatars.com/api/?name=Crypto&background=fbbf24&color=fff', elon_id, 890),
  ('88888888-8888-8888-8888-888888888888', 'AI Pioneers', 'Sharing the future of artificial intelligence together.', 'https://ui-avatars.com/api/?name=AI+Pioneers&background=a855f7&color=fff', elon_id, 2340)
  ON CONFLICT (name) DO UPDATE SET
    description = EXCLUDED.description,
    avatar_url = EXCLUDED.avatar_url,
    creator_id = EXCLUDED.creator_id,
    members_count = EXCLUDED.members_count;

  -- Join some users to communities
  INSERT INTO community_members (user_id, group_id) VALUES
  (elon_id, '66666666-6666-6666-6666-666666666666'),
  (sarah_id, '66666666-6666-6666-6666-666666666666'),
  (james_id, '66666666-6666-6666-6666-666666666666')
  ON CONFLICT DO NOTHING;


EXCEPTION WHEN OTHERS THEN
  -- Fallback if auth.users has strict constraints not met above
  RAISE NOTICE 'Failed to insert mock data: %', SQLERRM;
END $$;

-- ===== Direct Messaging =====
CREATE TABLE IF NOT EXISTS community_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS community_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES community_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE community_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Only participants can view passing conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON community_conversations;
CREATE POLICY "Users can view own conversations" ON community_conversations FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON community_conversations;
CREATE POLICY "Users can insert own conversations" ON community_conversations FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON community_conversations;
CREATE POLICY "Users can update own conversations" ON community_conversations FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS: Messages
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON community_messages;
CREATE POLICY "Users can view messages in own conversations" ON community_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM community_conversations c
  WHERE c.id = community_messages.conversation_id
  AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
));

DROP POLICY IF EXISTS "Users can insert own messages" ON community_messages;
CREATE POLICY "Users can insert own messages" ON community_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS members_count INT DEFAULT 0;


-- community_members table
CREATE TABLE IF NOT EXISTS community_members (
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    group_id UUID REFERENCES community_groups(id) ON DELETE CASCADE,
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (user_id, group_id)
);

-- Function to sync all member counts (run once or as needed)
CREATE OR REPLACE FUNCTION sync_community_member_counts() RETURNS void AS $$
BEGIN
  UPDATE community_groups cg
  SET members_count = (
    SELECT count(*) FROM community_members cm WHERE cm.group_id = cg.id
  );
END;
$$ LANGUAGE plpgsql;

-- Trigger to update member count
CREATE OR REPLACE FUNCTION update_community_member_count() RETURNS TRIGGER AS $$
BEGIN
  IF (TG_OP = 'INSERT') THEN
    UPDATE community_groups SET members_count = members_count + 1 WHERE id = NEW.group_id;
  ELSIF (TG_OP = 'DELETE') THEN
    UPDATE community_groups SET members_count = GREATEST(0, members_count - 1) WHERE id = OLD.group_id;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Run sync once to ensure data consistency
SELECT sync_community_member_counts();

DROP TRIGGER IF EXISTS trg_community_member_count ON community_members;
CREATE TRIGGER trg_community_member_count
AFTER INSERT OR DELETE ON community_members
FOR EACH ROW EXECUTE FUNCTION update_community_member_count();

-- RLS
ALTER TABLE community_groups ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view groups" ON community_groups;
CREATE POLICY "Anyone can view groups" ON community_groups FOR SELECT USING (true);

DROP POLICY IF EXISTS "Auth users can create groups" ON community_groups;
CREATE POLICY "Auth users can create groups" ON community_groups FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Creators can delete their own groups" ON community_groups;
CREATE POLICY "Creators can delete their own groups" ON community_groups FOR DELETE USING (auth.uid() = creator_id);

DROP POLICY IF EXISTS "Anyone can view members" ON community_members;
CREATE POLICY "Anyone can view members" ON community_members FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can manage own membership" ON community_members;
CREATE POLICY "Users can manage own membership" ON community_members FOR ALL USING (auth.uid() = user_id);

-- Ensure columns exist in case table was created before this version
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS creator_id UUID REFERENCES auth.users(id);
ALTER TABLE community_groups ADD COLUMN IF NOT EXISTS members_count INT DEFAULT 0;

-- (The seed data is now moved to the bottom DO $$ block to ensure users exist first)




-- ==================================================================================
-- DEPLOYMENT COMPLETE
-- ==================================================================================
-- All tables, functions, triggers, and RLS policies are now configured
-- Ready for production deployment to a new Supabase account
-- ==================================================================================

-- ===== Direct Messaging =====
CREATE TABLE IF NOT EXISTS community_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user1_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    user2_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    last_message_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
    UNIQUE(user1_id, user2_id)
);

CREATE TABLE IF NOT EXISTS community_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID REFERENCES community_conversations(id) ON DELETE CASCADE,
    sender_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

ALTER TABLE community_conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE community_messages ENABLE ROW LEVEL SECURITY;

-- RLS: Only participants can view passing conversations
DROP POLICY IF EXISTS "Users can view own conversations" ON community_conversations;
CREATE POLICY "Users can view own conversations" ON community_conversations FOR SELECT
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can insert own conversations" ON community_conversations;
CREATE POLICY "Users can insert own conversations" ON community_conversations FOR INSERT
WITH CHECK (auth.uid() = user1_id OR auth.uid() = user2_id);

DROP POLICY IF EXISTS "Users can update own conversations" ON community_conversations;
CREATE POLICY "Users can update own conversations" ON community_conversations FOR UPDATE
USING (auth.uid() = user1_id OR auth.uid() = user2_id);

-- RLS: Messages
DROP POLICY IF EXISTS "Users can view messages in own conversations" ON community_messages;
CREATE POLICY "Users can view messages in own conversations" ON community_messages FOR SELECT
USING (EXISTS (
  SELECT 1 FROM community_conversations c
  WHERE c.id = community_messages.conversation_id
  AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
));

DROP POLICY IF EXISTS "Users can insert own messages" ON community_messages;
CREATE POLICY "Users can insert own messages" ON community_messages FOR INSERT
WITH CHECK (auth.uid() = sender_id);

DROP POLICY IF EXISTS "Users can update own messages" ON community_messages;
CREATE POLICY "Users can update own messages" ON community_messages FOR UPDATE
USING (auth.uid() = sender_id OR EXISTS (
  SELECT 1 FROM community_conversations c
  WHERE c.id = community_messages.conversation_id
  AND (c.user1_id = auth.uid() OR c.user2_id = auth.uid())
));

-- إنشاء جدول الإعلانات
CREATE TABLE IF NOT EXISTS public.zetsuguide_ads (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title TEXT NOT NULL,
    text TEXT NOT NULL,
    link_url TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- تفعيل سياسات الأمان
ALTER TABLE public.zetsuguide_ads ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة إن وجدت لتجنب الأخطاء
DROP POLICY IF EXISTS "Anyone can view active ads" ON public.zetsuguide_ads;
DROP POLICY IF EXISTS "Admin full access to ads" ON public.zetsuguide_ads;

-- السماح للجميع برؤية الإعلانات المفعلة
CREATE POLICY "Anyone can view active ads"
ON public.zetsuguide_ads FOR SELECT
USING (is_active = true);

-- منح صلاحيات كاملة للمسؤولين
CREATE POLICY "Admin full access to ads"
ON public.zetsuguide_ads FOR ALL
USING (true);


-- ==========================================
-- Community Polls System
-- ==========================================

-- Table for the poll itself
CREATE TABLE IF NOT EXISTS public.community_polls (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE UNIQUE,
    question TEXT,
    ends_at TIMESTAMPTZ NOT NULL,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table for poll options
CREATE TABLE IF NOT EXISTS public.community_poll_options (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES public.community_polls(id) ON DELETE CASCADE,
    text TEXT NOT NULL,
    votes_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT now()
);

-- Table to track individual votes (prevents double voting)
CREATE TABLE IF NOT EXISTS public.community_poll_votes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    poll_id UUID REFERENCES public.community_polls(id) ON DELETE CASCADE,
    option_id UUID REFERENCES public.community_poll_options(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT now(),
    UNIQUE(poll_id, user_id)
);

-- Enable RLS
ALTER TABLE public.community_polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.community_poll_votes ENABLE ROW LEVEL SECURITY;

-- حذف السياسات القديمة للاستطلاعات
DROP POLICY IF EXISTS "Anyone can view polls" ON public.community_polls;
DROP POLICY IF EXISTS "Anyone can view poll options" ON public.community_poll_options;
DROP POLICY IF EXISTS "Users can view their own votes" ON public.community_poll_votes;
DROP POLICY IF EXISTS "Users can create polls" ON public.community_polls;
DROP POLICY IF EXISTS "Users can create options" ON public.community_poll_options;
DROP POLICY IF EXISTS "Users can cast votes" ON public.community_poll_votes;

-- Policies
CREATE POLICY "Anyone can view polls" ON public.community_polls FOR SELECT USING (true);
CREATE POLICY "Anyone can view poll options" ON public.community_poll_options FOR SELECT USING (true);
CREATE POLICY "Users can view their own votes" ON public.community_poll_votes FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create polls" ON public.community_polls FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can create options" ON public.community_poll_options FOR INSERT WITH CHECK (true);
CREATE POLICY "Users can cast votes" ON public.community_poll_votes FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Function to cast a vote safely (increments count + records vote)
DROP FUNCTION IF EXISTS public.cast_community_vote(UUID, UUID, UUID);
CREATE OR REPLACE FUNCTION public.cast_community_vote(
    p_poll_id UUID,
    p_option_id UUID,
    p_user_id UUID
) RETURNS VOID AS $$
BEGIN
    -- 1. Insert the vote record (will fail if UNIQUE constraint is violated)
    INSERT INTO public.community_poll_votes (poll_id, option_id, user_id)
    VALUES (p_poll_id, p_option_id, p_user_id);

    -- 2. Increment the votes_count in options table
    UPDATE public.community_poll_options
    SET votes_count = votes_count + 1
    WHERE id = p_option_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ==========================================
-- Smart Feed View
-- ==========================================
-- This view ranks posts based on engagement and time decay
CREATE OR REPLACE VIEW public.v_smart_feed AS
SELECT
    p.*,
    (
        COALESCE((SELECT count(*) FROM post_likes l WHERE l.post_id = p.id), 0) * 10 +
        COALESCE((SELECT count(*) FROM post_comments c WHERE c.post_id = p.id), 0) * 5
    ) / (POW(EXTRACT(EPOCH FROM (now() - p.created_at)) / 3600 + 2, 1.5)) as smart_score
FROM public.posts p;

-- Allow authenticated users to browse the smart feed
ALTER VIEW public.v_smart_feed OWNER TO postgres;
GRANT SELECT ON public.v_smart_feed TO authenticated;
GRANT SELECT ON public.v_smart_feed TO anon;

-- ==================================================================================
-- PART 12: COMMUNITY FOLLOWS (User-to-User Follow System)
-- ==================================================================================

-- Create community_follows table if it doesn't exist
CREATE TABLE IF NOT EXISTS community_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id),
  CONSTRAINT check_not_self_follow CHECK (follower_id != following_id)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_community_follows_follower ON community_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_following ON community_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_community_follows_created_at ON community_follows(created_at DESC);

-- Enable RLS on community_follows
ALTER TABLE community_follows ENABLE ROW LEVEL SECURITY;

-- RLS Policies for community_follows
-- Policy 1: Anyone can view follow relationships
DROP POLICY IF EXISTS "Anyone can view follows" ON community_follows;
CREATE POLICY "Anyone can view follows" ON community_follows
    FOR SELECT USING (true);

-- Policy 2: Authenticated users can insert (create new follow) if they are the follower
DROP POLICY IF EXISTS "Users can follow others" ON community_follows;
CREATE POLICY "Users can follow others" ON community_follows
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() = follower_id
        AND follower_id != following_id
    );

-- Policy 3: Allow upsert operation (update by auth user as follower)
DROP POLICY IF EXISTS "Users can upsert follows" ON community_follows;
CREATE POLICY "Users can upsert follows" ON community_follows
    FOR UPDATE USING (
        auth.role() = 'authenticated'
        AND auth.uid() = follower_id
    ) WITH CHECK (
        auth.role() = 'authenticated'
        AND auth.uid() = follower_id
    );

-- Policy 4: Only followers can delete (unfollow)
DROP POLICY IF EXISTS "Users can unfollow" ON community_follows;
CREATE POLICY "Users can unfollow" ON community_follows
    FOR DELETE USING (
        auth.role() = 'authenticated'
        AND auth.uid() = follower_id
    );

-- LEGACY: Prevent direct updates (old policy - removed in favor of upsert support)
-- DROP POLICY IF EXISTS "Prevent direct updates on follows" ON community_follows;

-- ==================================================================================
-- PART 4: UI COMPONENTS LIBRARY
-- ==================================================================================

-- ===== SECTION: create_ui_components_table.sql - UI Components =====
CREATE TABLE IF NOT EXISTS ui_components (
  id TEXT PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  tags TEXT[],
  html_code TEXT DEFAULT '',
  css_code TEXT DEFAULT '',
  js_code TEXT DEFAULT '',
  env_vars JSONB,
  author_name TEXT DEFAULT 'Anonymous Maker',
  author_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  author_avatar TEXT,
  theme TEXT DEFAULT 'light',
  views_count INTEGER DEFAULT 0,
  likes_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Defensive alter to add new columns in case the table already existed from the previous version
ALTER TABLE ui_components ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE ui_components ADD COLUMN IF NOT EXISTS tags TEXT[];
ALTER TABLE ui_components ADD COLUMN IF NOT EXISTS env_vars JSONB;

ALTER TABLE ui_components ADD COLUMN IF NOT EXISTS author_avatar TEXT;

-- Enable RLS
ALTER TABLE ui_components ENABLE ROW LEVEL SECURITY;

-- Create Policies
DROP POLICY IF EXISTS "Enable read access for all users" ON ui_components;
CREATE POLICY "Enable read access for all users" ON ui_components
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "Enable insert access for all users" ON ui_components;
CREATE POLICY "Enable insert access for all users" ON ui_components
  FOR INSERT
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authors" ON ui_components;
CREATE POLICY "Enable update for authors" ON ui_components
  FOR UPDATE
  USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Enable delete for authors" ON ui_components;
CREATE POLICY "Enable delete for authors" ON ui_components
  FOR DELETE
  USING (auth.uid() = author_id);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_ui_components_created_at ON ui_components (created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ui_components_author_id ON ui_components (author_id);
