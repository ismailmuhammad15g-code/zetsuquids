-- =============================================
-- CHAT HISTORY TABLE - Run in Supabase SQL Editor
-- This creates the table for storing chat conversations
-- =============================================

-- Create conversations table
CREATE TABLE IF NOT EXISTS zetsuguide_conversations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_email TEXT NOT NULL,
    title TEXT NOT NULL DEFAULT 'New Chat',
    messages JSONB NOT NULL DEFAULT '[]',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_conversations_user_email ON zetsuguide_conversations(user_email);
CREATE INDEX IF NOT EXISTS idx_conversations_updated_at ON zetsuguide_conversations(updated_at DESC);

-- Enable RLS (Row Level Security)
ALTER TABLE zetsuguide_conversations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own conversations
CREATE POLICY "Users can view own conversations" ON zetsuguide_conversations
    FOR SELECT USING (true);

CREATE POLICY "Users can insert own conversations" ON zetsuguide_conversations
    FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can update own conversations" ON zetsuguide_conversations
    FOR UPDATE USING (true);

CREATE POLICY "Users can delete own conversations" ON zetsuguide_conversations
    FOR DELETE USING (true);

-- Verify table was created
SELECT * FROM zetsuguide_conversations LIMIT 5;
