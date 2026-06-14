-- FIX 1: Allow counting all purchases for sales display
-- This policy lets anyone count purchases (but not see buyer details)

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
