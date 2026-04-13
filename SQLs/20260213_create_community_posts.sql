-- Enable UUID extension if not enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create posts table
CREATE TABLE IF NOT EXISTS posts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    category TEXT CHECK (category IN ('Help', 'Showcase', 'General')) DEFAULT 'General',
    likes_count INT DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_category ON posts(category);

-- Enable RLS
ALTER TABLE posts ENABLE ROW LEVEL SECURITY;

-- Policies
-- Read: Everyone can read posts
CREATE POLICY "Public posts are viewable by everyone." ON posts
    FOR SELECT USING (true);

-- Insert: Authenticated users can create posts
CREATE POLICY "Users can create posts" ON posts
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

-- Update: Users can update their own posts
CREATE POLICY "Users can update own posts" ON posts
    FOR UPDATE USING (auth.uid() = user_id);

-- Delete: Users can delete their own posts
CREATE POLICY "Users can delete own posts" ON posts
    FOR DELETE USING (auth.uid() = user_id);
