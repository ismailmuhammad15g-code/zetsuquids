-- FIX CHAT HISTORY ISSUES
-- Run this in Supabase SQL Editor

-- 1. Ensure table exists with correct schema
CREATE TABLE IF NOT EXISTS zetsuguide_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Create index for faster queries (if not exists)
CREATE INDEX IF NOT EXISTS idx_conversations_user_email_lower ON zetsuguide_conversations (lower(user_email));
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON zetsuguide_conversations(updated_at DESC);

-- 3. Fix RLS Policies (Drop old ones to be safe)
ALTER TABLE zetsuguide_conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own conversations" ON zetsuguide_conversations;
DROP POLICY IF EXISTS "Users can insert own conversations" ON zetsuguide_conversations;
DROP POLICY IF EXISTS "Users can update own conversations" ON zetsuguide_conversations;
DROP POLICY IF EXISTS "Users can delete own conversations" ON zetsuguide_conversations;
DROP POLICY IF EXISTS "Enable read access for own conversations" ON zetsuguide_conversations;
DROP POLICY IF EXISTS "Enable insert access for own conversations" ON zetsuguide_conversations;
DROP POLICY IF EXISTS "Enable update access for own conversations" ON zetsuguide_conversations;
DROP POLICY IF EXISTS "Enable delete access for own conversations" ON zetsuguide_conversations;

-- 4. Create proper policies (using email matching since we use email as ID here)
--    Note: We use lower() to be case-insensitive safely
CREATE POLICY "Enable read access for own conversations" ON zetsuguide_conversations
    FOR SELECT
    USING (
        auth.jwt() ->> 'email' = user_email
        OR
        lower(auth.jwt() ->> 'email') = lower(user_email)
    );

CREATE POLICY "Enable insert access for own conversations" ON zetsuguide_conversations
    FOR INSERT
    WITH CHECK (
        auth.jwt() ->> 'email' = user_email
        OR
        lower(auth.jwt() ->> 'email') = lower(user_email)
    );

CREATE POLICY "Enable update access for own conversations" ON zetsuguide_conversations
    FOR UPDATE
    USING (
        auth.jwt() ->> 'email' = user_email
        OR
        lower(auth.jwt() ->> 'email') = lower(user_email)
    );

CREATE POLICY "Enable delete access for own conversations" ON zetsuguide_conversations
    FOR DELETE
    USING (
        auth.jwt() ->> 'email' = user_email
        OR
        lower(auth.jwt() ->> 'email') = lower(user_email)
    );

-- 5. Grant permissions just in case
GRANT ALL ON zetsuguide_conversations TO authenticated;
GRANT ALL ON zetsuguide_conversations TO service_role;
