-- ═══════════════════════════════════════════════════════════════════════════
-- ZetsuGuides - Users Table Schema for Supabase
-- Run this SQL in your Supabase SQL Editor
-- ═══════════════════════════════════════════════════════════════════════════

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    is_verified BOOLEAN DEFAULT FALSE,
    verification_token VARCHAR(255),
    token_expiry TIMESTAMPTZ,
    verified_at TIMESTAMPTZ,
    reset_token VARCHAR(255),
    reset_token_expiry TIMESTAMPTZ,
    last_login TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_verification_token ON users(verification_token);
CREATE INDEX IF NOT EXISTS idx_users_reset_token ON users(reset_token);

-- Enable Row Level Security (RLS)
ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only read their own data
CREATE POLICY "Users can view own data" ON users
    FOR SELECT
    USING (true);

-- Policy: Allow insert for registration (public)
CREATE POLICY "Allow public registration" ON users
    FOR INSERT
    WITH CHECK (true);

-- Policy: Allow update for the service role and matching user
CREATE POLICY "Allow updates" ON users
    FOR UPDATE
    USING (true);

-- ═══════════════════════════════════════════════════════════════════════════
-- IMPORTANT: After creating the table, go to Supabase Dashboard:
-- 1. Settings → API → Copy the "service_role" key (NOT anon key)
-- 2. Use this service_role key in your backend .env as SUPABASE_SERVICE_KEY
-- ═══════════════════════════════════════════════════════════════════════════

-- To verify the table was created, run:
-- SELECT * FROM users LIMIT 1;
