-- Migration: Add author fields to guides table
-- This migration adds author information to the guides table
-- to track who created each guide

-- Add columns if they don't exist
ALTER TABLE guides
ADD COLUMN IF NOT EXISTS author_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS author_id UUID;

-- Create index on author fields for faster lookups
CREATE INDEX IF NOT EXISTS idx_guides_author_email ON guides(user_email);
CREATE INDEX IF NOT EXISTS idx_guides_author_id ON guides(author_id);

-- Update display: guides now show complete author information
-- user_email: Author's email address
-- author_name: Author's full name or display name
-- author_id: Reference to the user's auth ID for relationships

-- Note: Existing guides will have NULL author_name and author_id
-- New guides created by authenticated users will have all three fields populated
