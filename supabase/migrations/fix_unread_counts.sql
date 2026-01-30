-- Migration to add user_unread_count and fix trigger logic

-- 1. Add user_unread_count column if it doesn't exist
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'support_conversations' AND column_name = 'user_unread_count'
    ) THEN
        ALTER TABLE support_conversations ADD COLUMN user_unread_count INTEGER DEFAULT 0;
    END IF;
END $$;

-- 2. Update the trigger function to handle both unread counts correctly
CREATE OR REPLACE FUNCTION update_conversation_last_message()
RETURNS TRIGGER AS $$
BEGIN
    -- If Sender is USER:
    -- 1. Increment 'unread_count' (for Staff to see)
    -- 2. Reset 'user_unread_count' (since User sent a message, they likely read the chat) - OR maybe do this explicitly in frontend?
    --    Actually, usually sending a message implies you are active.
    
    -- If Sender is STAFF/ADMIN:
    -- 1. Increment 'user_unread_count' (for User to see)
    -- 2. Reset 'unread_count' (since Staff sent a message, they processed the unread ones) - This is a good auto-read feature.
    
    UPDATE support_conversations
    SET 
        last_message_at = NEW.created_at,
        unread_count = CASE 
            WHEN NEW.sender_type = 'user' THEN unread_count + 1
            ELSE 0 -- Auto-mark as read for Staff when they reply
        END,
        user_unread_count = CASE
            WHEN NEW.sender_type IN ('admin', 'staff') THEN user_unread_count + 1
            ELSE 0 -- Auto-mark as read for User when they reply? Maybe not, but usually safe.
        END
    WHERE id = NEW.conversation_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 3. Verify trigger exists (it should be covered by REFRESH, but ensuring naming)
DROP TRIGGER IF EXISTS trigger_update_last_message ON support_messages;
CREATE TRIGGER trigger_update_last_message
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION update_conversation_last_message();

-- 4. Initial Reset for existing data (optional but good for consistency)
UPDATE support_conversations SET user_unread_count = 0 WHERE user_unread_count IS NULL;
