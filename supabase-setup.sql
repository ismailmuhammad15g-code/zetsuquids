-- DevVault Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Drop existing tables if needed (BE CAREFUL - this will delete data!)
-- DROP TABLE IF EXISTS guides CASCADE;

-- Create guides table with all fields
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_guides_slug ON guides (slug);
CREATE INDEX IF NOT EXISTS idx_guides_title ON guides USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_guides_content ON guides USING GIN (to_tsvector('english', markdown));
CREATE INDEX IF NOT EXISTS idx_guides_keywords ON guides USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_guides_created_at ON guides (created_at DESC);

-- Enable Row Level Security (RLS)
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON guides;
DROP POLICY IF EXISTS "Enable insert access for all users" ON guides;
DROP POLICY IF EXISTS "Enable update access for all users" ON guides;
DROP POLICY IF EXISTS "Enable delete access for all users" ON guides;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON guides
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON guides
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON guides
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON guides
  FOR DELETE USING (true);

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Drop existing trigger if it exists
DROP TRIGGER IF EXISTS update_guides_updated_at ON guides;

-- Create trigger for guides table
CREATE TRIGGER update_guides_updated_at 
  BEFORE UPDATE ON guides
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add full-text search function
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
