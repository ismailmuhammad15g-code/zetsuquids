-- Seller Support Contact Info Table
-- Stores contact details for each seller/creator

CREATE TABLE IF NOT EXISTS seller_support (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  seller_id TEXT NOT NULL UNIQUE,
  seller_name TEXT DEFAULT '',
  whatsapp TEXT DEFAULT '',
  email TEXT DEFAULT '',
  discord TEXT DEFAULT '',
  telegram TEXT DEFAULT '',
  twitter TEXT DEFAULT '',
  website TEXT DEFAULT '',
  custom_message TEXT DEFAULT 'Hello! How can I help you?',
  response_time TEXT DEFAULT 'Usually responds within 24 hours',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast lookup
CREATE INDEX IF NOT EXISTS idx_seller_support_id ON seller_support(seller_id);

-- Enable RLS
ALTER TABLE seller_support ENABLE ROW LEVEL SECURITY;

-- Policies
DO $$
BEGIN
  -- Anyone can view seller support info (public page)
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'view_seller_support' AND tablename = 'seller_support') THEN
    CREATE POLICY "view_seller_support" ON seller_support FOR SELECT USING (true);
  END IF;

  -- Sellers can insert their own support info
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'insert_seller_support' AND tablename = 'seller_support') THEN
    CREATE POLICY "insert_seller_support" ON seller_support FOR INSERT WITH CHECK (auth.uid()::text = seller_id);
  END IF;

  -- Sellers can update their own support info
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'update_seller_support' AND tablename = 'seller_support') THEN
    CREATE POLICY "update_seller_support" ON seller_support FOR UPDATE USING (auth.uid()::text = seller_id);
  END IF;

  -- Sellers can delete their own support info
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'delete_seller_support' AND tablename = 'seller_support') THEN
    CREATE POLICY "delete_seller_support" ON seller_support FOR DELETE USING (auth.uid()::text = seller_id);
  END IF;
END $$;
