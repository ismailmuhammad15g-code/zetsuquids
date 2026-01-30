-- Add Delete Features to Support Chat
-- Run this script in Supabase SQL Editor

-- 1. Function to delete a conversation and its messages
CREATE OR REPLACE FUNCTION delete_support_conversation(conv_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    -- Messages are deleted automatically due to ON DELETE CASCADE
    DELETE FROM support_conversations WHERE id = conv_id;
    RETURN FOUND;
END;
$$ LANGUAGE plpgsql;

-- 2. Function to auto-delete messages older than 7 days
CREATE OR REPLACE FUNCTION cleanup_old_support_messages()
RETURNS void AS $$
BEGIN
    -- Delete messages older than 7 days
    DELETE FROM support_messages 
    WHERE created_at < NOW() - INTERVAL '7 days';
    
    -- Optional: Delete empty conversations that have no messages left?
    -- Maybe cleaner to keep the conversation metadata if needed, 
    -- but usually if all messages are gone, the conversation might differ.
    -- For now, let's strictly follow "delete messages automatically"
END;
$$ LANGUAGE plpgsql;

-- 3. Trigger to run cleanup automatically (Simple Cron Alternative)
-- Runs cleanup with 1% probability on every new message insert to avoid performance hit
CREATE OR REPLACE FUNCTION trigger_cleanup_support_messages()
RETURNS TRIGGER AS $$
BEGIN
    -- Run cleanup approx 1 out of 100 inserts
    IF (random() < 0.01) THEN
        PERFORM cleanup_old_support_messages();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_auto_cleanup_messages ON support_messages;
CREATE TRIGGER trigger_auto_cleanup_messages
AFTER INSERT ON support_messages
FOR EACH ROW
EXECUTE FUNCTION trigger_cleanup_support_messages();

SELECT 'SUCCESS! Added deletion functions and auto-cleanup trigger!' as status;
