-- Support Chat System Database Schema - COMPLETE VERSION
-- Run this ENTIRE script in Supabase SQL Editor
-- This creates tables for support conversations and messages with staff profile support

-- 1. Create support_conversations table
CREATE TABLE IF NOT EXISTS support_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_email TEXT NOT NULL,
    user_name TEXT,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'closed')),
    last_message_at TIMESTAMPTZ DEFAULT NOW(),
    unread_count INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. Drop existing constraint and table if needed to recreate with correct constraint
-- First, drop the old constraint
ALTER TABLE support_messages DROP CONSTRAINT IF EXISTS support_messages_sender_type_check;

-- 3. Create support_messages table with staff_profile_id (or alter existing)
CREATE TABLE IF NOT EXISTS support_messages (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    conversation_id UUID NOT NULL REFERENCES support_conversations(id) ON DELETE CASCADE,
    user_email TEXT NOT NULL,
    sender_type TEXT NOT NULL,
    sender_name TEXT,
    sender_avatar TEXT,
    staff_profile_id TEXT,
    message TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    read_at TIMESTAMPTZ
);

-- 4. Add the correct constraint that includes 'staff'
ALTER TABLE support_messages 
ADD CONSTRAINT support_messages_sender_type_check 
CHECK (sender_type IN ('user', 'admin', 'staff'));

-- 5. Add staff_profile_id column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'support_messages' AND column_name = 'staff_profile_id'
    ) THEN
        ALTER TABLE support_messages ADD COLUMN staff_profile_id TEXT;
    END IF;
END $$;

-- 6. Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_conversation_id ON support_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_user_email ON support_messages(user_email);
CREATE INDEX IF NOT EXISTS idx_created_at ON support_messages(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_conversations_user ON support_conversations(user_email);
CREATE INDEX IF NOT EXISTS idx_conversations_status ON support_conversations(status);
CREATE INDEX IF NOT EXISTS idx_sender_type ON support_messages(sender_type);

-- 7. Disable RLS for now (for testing)
ALTER TABLE support_conversations DISABLE ROW LEVEL SECURITY;
ALTER TABLE support_messages DISABLE ROW LEVEL SECURITY;

-- 8. Grant access to authenticated and anonymous users
GRANT ALL ON support_conversations TO authenticated;
GRANT ALL ON support_conversations TO anon;
GRANT ALL ON support_messages TO authenticated;
GRANT ALL ON support_messages TO anon;

-- 9. Enable Realtime for both tables
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'support_conversations'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE support_conversations;
    END IF;
    
    IF NOT EXISTS (
        SELECT 1 FROM pg_publication_tables 
        WHERE pubname = 'supabase_realtime' 
        AND tablename = 'support_messages'
    ) THEN
        ALTER PUBLICATION supabase_realtime ADD TABLE support_messages;
    END IF;
END $$;

-- 10. Create function to update last_message_at and unread_count
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE support_conversations
    SET 
        last_message_at = NEW.created_at,
        unread_count = CASE 
            WHEN NEW.sender_type = 'user' THEN unread_count + 1
            ELSE 0
        END
    WHERE id = NEW.conversation_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 11. Create trigger for last_message_at
DROP TRIGGER IF EXISTS trigger_update_last_message ON support_messages;
CREATE TRIGGER trigger_update_last_message
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- Success message
SELECT 'SUCCESS! Support chat schema updated with staff support!' as status;
