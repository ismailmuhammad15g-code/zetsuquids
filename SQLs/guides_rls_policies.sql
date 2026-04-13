-- Add RLS policy for guide deletion
-- This allows users to delete guides they own (where user_email matches their auth email)

-- Enable RLS if not already enabled
ALTER TABLE guides ENABLE ROW LEVEL SECURITY;

-- Drop existing delete policy if it exists
DROP POLICY IF EXISTS "Users can delete their own guides" ON guides;

-- Create policy: Users can delete guides where user_email matches their authenticated email
CREATE POLICY "Users can delete their own guides"
ON guides
FOR DELETE
USING (
    auth.jwt() ->> 'email' = user_email
);

-- Also ensure users can view and update their own guides
DROP POLICY IF EXISTS "Users can view all guides" ON guides;
CREATE POLICY "Users can view all guides"
ON guides
FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Users can insert guides" ON guides;
CREATE POLICY "Users can insert guides"
ON guides
FOR INSERT
WITH CHECK (
    auth.jwt() ->> 'email' = user_email
);

DROP POLICY IF EXISTS "Users can update their own guides" ON guides;
CREATE POLICY "Users can update their own guides"
ON guides
FOR UPDATE
USING (
    auth.jwt() ->> 'email' = user_email
);
