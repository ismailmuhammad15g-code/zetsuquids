-- Migration to add button_text column to zetsuguide_ads table
-- Run this SQL in your Supabase SQL Editor to add the new field

-- Add button_text column if it doesn't exist
ALTER TABLE zetsuguide_ads ADD COLUMN IF NOT EXISTS button_text TEXT DEFAULT '';

-- Update any existing ads that don't have button_text set
UPDATE zetsuguide_ads 
SET button_text = '' 
WHERE button_text IS NULL;

-- Verify the column was added successfully
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'zetsuguide_ads' 
AND column_name = 'button_text';