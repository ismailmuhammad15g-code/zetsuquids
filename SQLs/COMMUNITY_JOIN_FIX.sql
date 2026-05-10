-- Add community joined tracking column to profiles
ALTER TABLE zetsuguide_user_profiles ADD COLUMN IF NOT EXISTS has_joined_community BOOLEAN DEFAULT FALSE;

-- Ensure it's returned in RPCs if necessary or just accessible via standard REST
