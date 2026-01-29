-- Reset Chatbot Tokens to 30 for All Users
-- Run this in Supabase SQL Editor

-- Option 1: Reset for your specific account (replace with your email)
UPDATE user_chatbot_usage
SET tokens_left = 30,
    last_reset_at = NOW()
WHERE user_id = (
    SELECT id FROM auth.users 
    WHERE email = 'your-email@example.com'
);

-- Option 2: Reset for ALL users (use with caution!)
UPDATE user_chatbot_usage
SET tokens_left = 30,
    last_reset_at = NOW();

-- Option 3: Delete all records and let the app recreate them with 30 tokens
DELETE FROM user_chatbot_usage;

-- Verify the change
SELECT 
    u.email,
    uc.tokens_left,
    uc.last_reset_at
FROM user_chatbot_usage uc
JOIN auth.users u ON u.id = uc.user_id;
