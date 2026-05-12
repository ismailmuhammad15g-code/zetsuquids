-- Add missing last_seen column to user profiles
ALTER TABLE zetsuguide_user_profiles ADD COLUMN IF NOT EXISTS last_seen TIMESTAMPTZ DEFAULT NOW();

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_last_seen ON zetsuguide_user_profiles(last_seen);
