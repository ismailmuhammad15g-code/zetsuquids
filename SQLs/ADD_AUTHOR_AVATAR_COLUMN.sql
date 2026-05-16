-- Quick fix: Add missing author_avatar column to marketplace_scripts
-- Run this in Supabase SQL Editor

ALTER TABLE marketplace_scripts ADD COLUMN IF NOT EXISTS author_avatar TEXT;
