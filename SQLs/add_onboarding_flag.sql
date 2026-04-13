-- Add has_seen_onboarding column to zetsuguide_user_profiles table
ALTER TABLE public.zetsuguide_user_profiles
ADD COLUMN IF NOT EXISTS has_seen_onboarding BOOLEAN DEFAULT FALSE;
