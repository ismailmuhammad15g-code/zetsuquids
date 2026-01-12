-- Fix: Add missing 'slug' column to existing guides table
-- Run this SQL in your Supabase SQL Editor

-- Add the slug column if it doesn't exist
ALTER TABLE guides ADD COLUMN IF NOT EXISTS slug TEXT;

-- Generate slugs for existing rows (from title)
UPDATE guides
SET slug = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(title, '[^a-zA-Z0-9\s]', '', 'g'), '\s+', '-', 'g')) || '-' || id
WHERE slug IS NULL OR slug = '';

-- Make slug unique and not null
ALTER TABLE guides ALTER COLUMN slug SET NOT NULL;

-- Create unique index on slug
CREATE UNIQUE INDEX IF NOT EXISTS idx_guides_slug ON guides (slug);

-- Add other potentially missing columns
ALTER TABLE guides ADD COLUMN IF NOT EXISTS markdown TEXT DEFAULT '';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS html_content TEXT DEFAULT '';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS css_content TEXT DEFAULT '';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS keywords TEXT[] DEFAULT '{}';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS content_type TEXT DEFAULT 'markdown';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- Create the update trigger if it doesn't exist
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_guides_updated_at ON guides;

CREATE TRIGGER update_guides_updated_at
  BEFORE UPDATE ON guides
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
