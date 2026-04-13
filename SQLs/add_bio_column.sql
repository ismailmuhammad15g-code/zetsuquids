-- Add bio column to zetsuguide_user_profiles table
-- This migration adds support for user bios in their workspace profiles

ALTER TABLE public.zetsuguide_user_profiles
ADD COLUMN IF NOT EXISTS bio text;

-- Add comment to the column
COMMENT ON COLUMN public.zetsuguide_user_profiles.bio IS 'User biography/description (max 200 characters)';

-- Update the updated_at timestamp when bio is changed
-- The existing trigger should handle this automatically if it exists

-- Make sure RLS policies allow reading bio
-- The existing SELECT policy already covers this since it selects all columns

-- Verify the column was added
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'zetsuguide_user_profiles' AND column_name = 'bio';
