-- Drop existing restrictive policies
DROP POLICY IF EXISTS "insert_seller_support" ON seller_support;
DROP POLICY IF EXISTS "update_seller_support" ON seller_support;
DROP POLICY IF EXISTS "delete_seller_support" ON seller_support;

-- Allow any authenticated user to insert (we check seller_id in app code)
CREATE POLICY "insert_seller_support" ON seller_support
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

-- Allow sellers to update their own support info
CREATE POLICY "update_seller_support" ON seller_support
FOR UPDATE
USING (auth.uid()::text = seller_id OR auth.role() = 'service_role');

-- Allow sellers to delete their own support info
CREATE POLICY "delete_seller_support" ON seller_support
FOR DELETE
USING (auth.uid()::text = seller_id OR auth.role() = 'service_role');
