-- =========================================================================================
-- ZETSUMARKET MARKETPLACE TABLES
-- =========================================================================================
-- Execute this script in your Supabase SQL Editor to create all marketplace tables.
-- This fixes 404 errors on marketplace_comments, marketplace_reviews, etc.
-- =========================================================================================

BEGIN;

-- Ensure required extensions and functions exist
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Ensure update_updated_at_column function exists
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==================================================================================
-- 1. MARKETPLACE SCRIPTS TABLE
-- ==================================================================================
CREATE TABLE IF NOT EXISTS marketplace_scripts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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
  status TEXT DEFAULT 'Active',
  sales_count INTEGER DEFAULT 0,
  rating NUMERIC(3,2) DEFAULT 0,
  reviews_count INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for marketplace_scripts
CREATE INDEX IF NOT EXISTS idx_marketplace_scripts_author ON marketplace_scripts(author_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_scripts_status ON marketplace_scripts(status);
CREATE INDEX IF NOT EXISTS idx_marketplace_scripts_category ON marketplace_scripts(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_scripts_created ON marketplace_scripts(created_at DESC);

-- RLS for marketplace_scripts
ALTER TABLE marketplace_scripts ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view active scripts" ON marketplace_scripts;
CREATE POLICY "Anyone can view active scripts" ON marketplace_scripts
  FOR SELECT USING (status = 'Active' OR auth.uid() = author_id);

DROP POLICY IF EXISTS "Authenticated users can insert scripts" ON marketplace_scripts;
CREATE POLICY "Authenticated users can insert scripts" ON marketplace_scripts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can update their own scripts" ON marketplace_scripts;
CREATE POLICY "Authors can update their own scripts" ON marketplace_scripts
  FOR UPDATE USING (auth.uid() = author_id);

DROP POLICY IF EXISTS "Authors can delete their own scripts" ON marketplace_scripts;
CREATE POLICY "Authors can delete their own scripts" ON marketplace_scripts
  FOR DELETE USING (auth.uid() = author_id);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_marketplace_scripts_updated_at ON marketplace_scripts;
CREATE TRIGGER update_marketplace_scripts_updated_at
  BEFORE UPDATE ON marketplace_scripts
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- ==================================================================================
-- 2. MARKETPLACE PURCHASES TABLE
-- ==================================================================================
CREATE TABLE IF NOT EXISTS marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES marketplace_scripts(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL,
  amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status TEXT DEFAULT 'completed',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for marketplace_purchases
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_script ON marketplace_purchases(script_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_purchases_buyer ON marketplace_purchases(buyer_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_purchases_unique ON marketplace_purchases(script_id, buyer_id);

-- RLS for marketplace_purchases
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Buyers can view their own purchases" ON marketplace_purchases;
CREATE POLICY "Buyers can view their own purchases" ON marketplace_purchases
  FOR SELECT USING (auth.uid() = buyer_id);

DROP POLICY IF EXISTS "Authenticated users can make purchases" ON marketplace_purchases;
CREATE POLICY "Authenticated users can make purchases" ON marketplace_purchases
  FOR INSERT WITH CHECK (auth.uid() = buyer_id);

-- ==================================================================================
-- 3. MARKETPLACE REVIEWS TABLE
-- ==================================================================================
CREATE TABLE IF NOT EXISTS marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES marketplace_scripts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  author_name TEXT DEFAULT 'Anonymous',
  author_avatar TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for marketplace_reviews
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_script ON marketplace_reviews(script_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_reviews_reviewer ON marketplace_reviews(reviewer_id);

-- RLS for marketplace_reviews
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view reviews" ON marketplace_reviews;
CREATE POLICY "Anyone can view reviews" ON marketplace_reviews
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post reviews" ON marketplace_reviews;
CREATE POLICY "Authenticated users can post reviews" ON marketplace_reviews
  FOR INSERT WITH CHECK (auth.uid() = reviewer_id);

-- ==================================================================================
-- 4. MARKETPLACE COMMENTS TABLE
-- ==================================================================================
CREATE TABLE IF NOT EXISTS marketplace_comments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES marketplace_scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  author_name TEXT DEFAULT 'Anonymous',
  author_avatar TEXT,
  comment_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for marketplace_comments
CREATE INDEX IF NOT EXISTS idx_marketplace_comments_script ON marketplace_comments(script_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_comments_user ON marketplace_comments(user_id);

-- RLS for marketplace_comments
ALTER TABLE marketplace_comments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view comments" ON marketplace_comments;
CREATE POLICY "Anyone can view comments" ON marketplace_comments
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated users can post comments" ON marketplace_comments;
CREATE POLICY "Authenticated users can post comments" ON marketplace_comments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own comments" ON marketplace_comments;
CREATE POLICY "Users can delete their own comments" ON marketplace_comments
  FOR DELETE USING (auth.uid() = user_id);

-- ==================================================================================
-- 5. MARKETPLACE FAVORITES TABLE
-- ==================================================================================
CREATE TABLE IF NOT EXISTS marketplace_favorites (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  script_id UUID NOT NULL REFERENCES marketplace_scripts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for marketplace_favorites
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_script ON marketplace_favorites(script_id);
CREATE INDEX IF NOT EXISTS idx_marketplace_favorites_user ON marketplace_favorites(user_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_marketplace_favorites_unique ON marketplace_favorites(script_id, user_id);

-- RLS for marketplace_favorites
ALTER TABLE marketplace_favorites ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own favorites" ON marketplace_favorites;
CREATE POLICY "Users can view their own favorites" ON marketplace_favorites
  FOR SELECT USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can add favorites" ON marketplace_favorites;
CREATE POLICY "Users can add favorites" ON marketplace_favorites
  FOR INSERT WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can remove their own favorites" ON marketplace_favorites;
CREATE POLICY "Users can remove their own favorites" ON marketplace_favorites
  FOR DELETE USING (auth.uid() = user_id);

-- ==================================================================================
-- 6. FUNCTION: Update script rating on new review
-- ==================================================================================
CREATE OR REPLACE FUNCTION update_script_rating()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_scripts
  SET
    rating = (SELECT COALESCE(AVG(rating), 0) FROM marketplace_reviews WHERE script_id = NEW.script_id),
    reviews_count = (SELECT COUNT(*) FROM marketplace_reviews WHERE script_id = NEW.script_id)
  WHERE id = NEW.script_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_script_rating ON marketplace_reviews;
CREATE TRIGGER trigger_update_script_rating
  AFTER INSERT ON marketplace_reviews
  FOR EACH ROW
  EXECUTE FUNCTION update_script_rating();

-- ==================================================================================
-- 7. FUNCTION: Update sales count on new purchase
-- ==================================================================================
CREATE OR REPLACE FUNCTION update_script_sales_count()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE marketplace_scripts
  SET sales_count = sales_count + 1
  WHERE id = NEW.script_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trigger_update_sales_count ON marketplace_purchases;
CREATE TRIGGER trigger_update_sales_count
  AFTER INSERT ON marketplace_purchases
  FOR EACH ROW
  EXECUTE FUNCTION update_script_sales_count();

COMMIT;

-- SUCCESS: All marketplace tables created.
