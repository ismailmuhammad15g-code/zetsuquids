-- FIX 1: Allow counting all purchases for sales display
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'count_purchases'
    AND tablename = 'marketplace_purchases'
  ) THEN
    CREATE POLICY "count_purchases" ON marketplace_purchases
    FOR SELECT
    USING (true);
  END IF;
END $$;

-- FIX 2: Add user_email column to comments for avatar lookup
ALTER TABLE marketplace_comments ADD COLUMN IF NOT EXISTS user_email TEXT;

-- FIX 3: Add user_email column to reviews for avatar lookup
ALTER TABLE marketplace_reviews ADD COLUMN IF NOT EXISTS user_email TEXT;
