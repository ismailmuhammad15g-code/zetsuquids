-- Clean up existing tables safely if they exist (since previous versions lacked new columns)
DROP TABLE IF EXISTS marketplace_reviews CASCADE;
DROP TABLE IF EXISTS marketplace_purchases CASCADE;
DROP TABLE IF EXISTS marketplace_scripts CASCADE;

-- Updated Schema for Marketplace Scripts (Using Supabase for Data, GitHub for Storage)
CREATE TABLE marketplace_scripts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL,
  description TEXT NOT NULL,
  long_description TEXT,
  features TEXT[] DEFAULT '{}',
  price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
  category VARCHAR(100) NOT NULL,
  tags TEXT[] DEFAULT '{}',
  version VARCHAR(50) DEFAULT '1.0.0',
  
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  author_name VARCHAR(255) NOT NULL DEFAULT 'Anonymous',
  
  thumbnail_url TEXT, -- Changed to TEXT to support long base64 image strings
  preview_url TEXT,
  github_repo_url TEXT,
  
  sales_count INT DEFAULT 0,
  rating DECIMAL(3, 2) DEFAULT 0.00,
  reviews_count INT DEFAULT 0,
  status VARCHAR(50) DEFAULT 'Active', -- Active, Paused
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marketplace_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES marketplace_scripts(id) ON DELETE CASCADE,
  buyer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount DECIMAL(10, 2) NOT NULL,
  purchase_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  script_id UUID NOT NULL REFERENCES marketplace_scripts(id) ON DELETE CASCADE,
  reviewer_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  rating INT NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Row Level Security (RLS)
ALTER TABLE marketplace_scripts ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_purchases ENABLE ROW LEVEL SECURITY;
ALTER TABLE marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- Allow public read access to active scripts
CREATE POLICY "Public scripts are viewable by everyone" ON marketplace_scripts
  FOR SELECT USING (status = 'Active');

-- Allow authors to view all their own scripts (including paused)
CREATE POLICY "Authors can view own scripts" ON marketplace_scripts
  FOR SELECT USING (auth.uid() = author_id);

-- Allow authors to insert their own scripts
CREATE POLICY "Authors can create scripts" ON marketplace_scripts
  FOR INSERT WITH CHECK (auth.uid() = author_id);

-- Allow authors to update their own scripts
CREATE POLICY "Authors can update own scripts" ON marketplace_scripts
  FOR UPDATE USING (auth.uid() = author_id);

-- Function to auto-update updated_at for PostgreSQL
CREATE OR REPLACE FUNCTION update_marketplace_modified_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_marketplace_scripts_modtime ON marketplace_scripts;

CREATE TRIGGER update_marketplace_scripts_modtime
    BEFORE UPDATE ON marketplace_scripts
    FOR EACH ROW
    EXECUTE FUNCTION update_marketplace_modified_column();

-- Indexes for performance
CREATE INDEX IF NOT EXISTS idx_marketplace_category ON marketplace_scripts(category);
CREATE INDEX IF NOT EXISTS idx_marketplace_author ON marketplace_scripts(author_id);
