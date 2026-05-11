-- Migration: Add missing columns to support_messages table
-- Run this in your Supabase SQL editor

-- Add user_id column so we can look up who to notify when staff replies
ALTER TABLE support_messages
  ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;

-- Add staff_profile_id so the correct animated avatar shows in the user's chat
ALTER TABLE support_messages
  ADD COLUMN IF NOT EXISTS staff_profile_id TEXT;

-- Index for fast lookup of user_id (used when sending notifications)
CREATE INDEX IF NOT EXISTS idx_support_messages_user_id
  ON support_messages (user_id)
  WHERE user_id IS NOT NULL;

-- Refresh the schema cache so PostgREST picks up the new columns immediately
NOTIFY pgrst, 'reload schema';
