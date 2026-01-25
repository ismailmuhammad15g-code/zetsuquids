-- =============================================
-- FIXED Usage Logs System
-- Run this in Supabase SQL Editor to fix the "No usage history" issue
-- =============================================

-- 1. Ensure Table Exists
CREATE TABLE IF NOT EXISTS zetsuguide_usage_logs (
  id BIGSERIAL PRIMARY KEY,
  user_email TEXT NOT NULL,
  action TEXT NOT NULL, 
  cost INTEGER DEFAULT 1,
  details TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Enable RLS
ALTER TABLE zetsuguide_usage_logs ENABLE ROW LEVEL SECURITY;

-- 3. FIX BROKEN POLICIES
-- The previous policy compared UUID to Email, which always failed.
-- This new policy correctly checks the email from the JWT token.

DROP POLICY IF EXISTS "Users can view own logs" ON zetsuguide_usage_logs;
CREATE POLICY "Users can view own logs" ON zetsuguide_usage_logs
  FOR SELECT
  USING (
    user_email = (auth.jwt() ->> 'email')
  );

DROP POLICY IF EXISTS "Users can insert own logs" ON zetsuguide_usage_logs;
CREATE POLICY "Users can insert own logs" ON zetsuguide_usage_logs
  FOR INSERT
  WITH CHECK (
    user_email = (auth.jwt() ->> 'email')
  );

-- 4. Indexes (Good for performance)
CREATE INDEX IF NOT EXISTS idx_usage_logs_email ON zetsuguide_usage_logs (user_email);
CREATE INDEX IF NOT EXISTS idx_usage_logs_created ON zetsuguide_usage_logs (created_at DESC);

-- 5. Status Check
SELECT 'Usage logs table fixed successfully' as status;
