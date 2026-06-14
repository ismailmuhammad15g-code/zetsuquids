-- Add DELETE policy for marketplace_purchases
-- Allows buyers to remove purchases from their own account

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'delete_purchases'
    AND tablename = 'marketplace_purchases'
  ) THEN
    CREATE POLICY "delete_purchases" ON marketplace_purchases
    FOR DELETE
    USING (auth.uid() = buyer_id);
  END IF;
END $$;
