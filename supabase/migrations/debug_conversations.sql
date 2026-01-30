-- Check for duplicates and constraints
SELECT 
    user_email, 
    COUNT(*) as count 
FROM support_conversations 
GROUP BY user_email 
HAVING COUNT(*) > 1;

-- Check table constraints
SELECT 
    conname as constraint_name, 
    contype as constraint_type, 
    pg_get_constraintdef(c.oid) as definition
FROM pg_constraint c 
JOIN pg_class t ON c.conrelid = t.oid 
WHERE t.relname = 'support_conversations';
