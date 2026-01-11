-- DevVault Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor

-- Drop existing tables if they exist (BE CAREFUL - this will delete data!)
-- Uncomment these lines if you want to start fresh:
-- DROP TABLE IF EXISTS prompts CASCADE;
-- DROP TABLE IF EXISTS guides CASCADE;

-- Create prompts table
CREATE TABLE IF NOT EXISTS prompts (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create guides table
CREATE TABLE IF NOT EXISTS guides (
  id BIGSERIAL PRIMARY KEY,
  title TEXT NOT NULL,
  filename TEXT NOT NULL,
  content TEXT,
  keywords TEXT[] DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  indexed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better search performance
CREATE INDEX IF NOT EXISTS idx_prompts_title ON prompts USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_prompts_content ON prompts USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_prompts_tags ON prompts USING GIN (tags);
CREATE INDEX IF NOT EXISTS idx_prompts_created_at ON prompts (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_guides_title ON guides USING GIN (to_tsvector('english', title));
CREATE INDEX IF NOT EXISTS idx_guides_content ON guides USING GIN (to_tsvector('english', content));
CREATE INDEX IF NOT EXISTS idx_guides_keywords ON guides USING GIN (keywords);
CREATE INDEX IF NOT EXISTS idx_guides_filename ON guides (filename);

-- Enable Row Level Security (RLS)
ALTER TABLE prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Enable read access for all users" ON prompts;
DROP POLICY IF EXISTS "Enable insert access for all users" ON prompts;
DROP POLICY IF EXISTS "Enable update access for all users" ON prompts;
DROP POLICY IF EXISTS "Enable delete access for all users" ON prompts;

DROP POLICY IF EXISTS "Enable read access for all users" ON guides;
DROP POLICY IF EXISTS "Enable insert access for all users" ON guides;
DROP POLICY IF EXISTS "Enable update access for all users" ON guides;
DROP POLICY IF EXISTS "Enable delete access for all users" ON guides;

-- Create policies for public access
CREATE POLICY "Enable read access for all users" ON prompts
  FOR SELECT USING (true);

CREATE POLICY "Enable insert access for all users" ON prompts
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Enable update access for all users" ON prompts
  FOR UPDATE USING (true);

CREATE POLICY "Enable delete access for all users" ON prompts
  FOR DELETE USING (true);

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
DROP TRIGGER IF EXISTS update_prompts_updated_at ON prompts;

-- Create trigger for prompts table
CREATE TRIGGER update_prompts_updated_at BEFORE UPDATE ON prompts
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
