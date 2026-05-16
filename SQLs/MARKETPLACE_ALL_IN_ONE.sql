-- =========================================================================================
-- MARKETPLACE ALL-IN-ONE SQL
-- =========================================================================================
-- Run this SINGLE file in Supabase SQL Editor
-- Creates all marketplace tables safely without deleting existing data
-- =========================================================================================

-- Create marketplace_scripts table if not exists
CREATE TABLE IF NOT EXISTS marketplace_scripts (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  price NUMERIC(10,2) NOT NULL DEFAULT 0,
  category TEXT NOT NULL DEFAULT 'React',
  tags TEXT[] DEFAULT '{}',
  version TEXT DEFAULT '1.0.0',
  features TEXT[] DEFAULT '{}',
  github_repo_url TEXT,
  thumbnail_url TEXT,
  preview_url TEXT,
  author_id UUID NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Unknown Creator',
  author_avatar TEXT,
  contact_url TEXT,
  status TEXT DEFAULT 'Active',
  sales_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to marketplace_scripts
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS author_avatar TEXT;
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS contact_url TEXT;
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS long_description TEXT;

-- Add missing columns to marketplace_purchases
ALTER TABLE marketplace_purchases ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE marketplace_purchases ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'completed';
ALTER TABLE marketplace_purchases ADD COLUMN IF NOT EXISTS amount NUMERIC(10,2) DEFAULT 0;
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS version TEXT DEFAULT '1.0.0';
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS features TEXT[] DEFAULT '{}';
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS github_repo_url TEXT;
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS reviews_count INTEGER DEFAULT 0;
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS sales_count INTEGER DEFAULT 0;
ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS rating NUMERIC(3,2) DEFAULT 0;

-- Create marketplace_purchases table
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL,
  buyer_id UUID NOT NULL,
  amount NUMERIC(10,2) DEFAULT 0,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create marketplace_reviews table
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  author_name TEXT DEFAULT 'Anonymous',
  author_avatar TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to marketplace_reviews
ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'Anonymous';
ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS author_avatar TEXT;

-- Create marketplace_comments table
CREATE TABLE IF NOT EXISTS marketplace_comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL,
  user_id UUID NOT NULL,
  author_name TEXT DEFAULT 'Anonymous',
  author_avatar TEXT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add missing columns to marketplace_comments
ALTER TABLE marketplace_comments ADD COLUMN IF NOT EXISTS author_name TEXT DEFAULT 'Anonymous';
ALTER TABLE marketplace_comments ADD COLUMN IF NOT EXISTS author_avatar TEXT;

-- Create marketplace_favorites table
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  script_id UUID NOT NULL,
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_scripts_author ON marketplace_scripts(author_id);
CREATE INDEX IF NOT EXISTS idx_scripts_status ON marketplace_scripts(status);
CREATE INDEX IF NOT EXISTS idx_scripts_category ON marketplace_scripts(category);
CREATE INDEX IF NOT EXISTS idx_purchases_script ON marketplace_purchases(script_id);
CREATE INDEX IF NOT EXISTS idx_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_purchases_unique ON marketplace_purchases(script_id, buyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_script ON marketplace_reviews(script_id);
CREATE INDEX IF NOT EXISTS idx_comments_script ON marketplace_comments(script_id);
CREATE INDEX IF NOT EXISTS idx_favorites_script ON marketplace_favorites(script_id);
CREATE INDEX IF NOT EXISTS idx_favorites_user ON marketplace_favorites(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_favorites_unique ON marketplace_favorites(script_id, user_id);

-- Enable RLS
ALTER TABLE marketplace_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;

-- Create RLS policies (only if they don't exist)
DO $$
BEGIN
  -- Scripts policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'view_scripts' AND tablename = 'marketplace_scripts') THEN
    CREATE POLICY "view_scripts" ON marketplace_scripts FOR SELECT USING (status = 'Active' OR auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_scripts' AND tablename = 'marketplace_scripts') THEN
    CREATE POLICY "insert_scripts" ON marketplace_scripts FOR INSERT WITH CHECK (auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'update_scripts' AND tablename = 'marketplace_scripts') THEN
    CREATE POLICY "update_scripts" ON marketplace_scripts FOR UPDATE USING (auth.uid() = author_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delete_scripts' AND tablename = 'marketplace_scripts') THEN
    CREATE POLICY "delete_scripts" ON marketplace_scripts FOR DELETE USING (auth.uid() = author_id);
  END IF;

  -- Purchases policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'view_purchases' AND tablename = 'marketplace_purchases') THEN
    CREATE POLICY "view_purchases" ON marketplace_purchases FOR SELECT USING (auth.uid() = buyer_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_purchases' AND tablename = 'marketplace_purchases') THEN
    CREATE POLICY "insert_purchases" ON marketplace_purchases FOR INSERT WITH CHECK (auth.uid() = buyer_id);
  END IF;

  -- Reviews policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'view_reviews' AND tablename = 'marketplace_reviews') THEN
    CREATE POLICY "view_reviews" ON marketplace_reviews FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_reviews' AND tablename = 'marketplace_reviews') THEN
    CREATE POLICY "insert_reviews" ON marketplace_reviews FOR INSERT WITH CHECK (auth.uid() = reviewer_id);
  END IF;

  -- Comments policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'view_comments' AND tablename = 'marketplace_comments') THEN
    CREATE POLICY "view_comments" ON marketplace_comments FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_comments' AND tablename = 'marketplace_comments') THEN
    CREATE POLICY "insert_comments" ON marketplace_comments FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delete_comments' AND tablename = 'marketplace_comments') THEN
    CREATE POLICY "delete_comments" ON marketplace_comments FOR DELETE USING (auth.uid() = user_id);
  END IF;

  -- Favorites policies
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'view_favorites' AND tablename = 'marketplace_favorites') THEN
    CREATE POLICY "view_favorites" ON marketplace_favorites FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_favorites' AND tablename = 'marketplace_favorites') THEN
    CREATE POLICY "insert_favorites" ON marketplace_favorites FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delete_favorites' AND tablename = 'marketplace_favorites') THEN
    CREATE POLICY "delete_favorites" ON marketplace_favorites FOR DELETE USING (auth.uid() = user_id);
  END IF;
END $$;
