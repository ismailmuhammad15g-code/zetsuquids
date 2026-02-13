-- 1. Create Post Comments Table
CREATE TABLE IF NOT EXISTS public.post_comments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for comments
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Policies for comments
DROP POLICY IF EXISTS "Public comments are viewable by everyone" ON public.post_comments;
CREATE POLICY "Public comments are viewable by everyone" ON public.post_comments
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
CREATE POLICY "Users can create comments" ON public.post_comments
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;
CREATE POLICY "Users can delete own comments" ON public.post_comments
    FOR DELETE USING (auth.uid() = user_id);

-- 2. Create Post Likes Table
CREATE TABLE IF NOT EXISTS public.post_likes (
    post_id UUID REFERENCES public.posts(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    PRIMARY KEY (post_id, user_id)
);

-- Enable RLS for likes
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;

-- Policies for likes
DROP POLICY IF EXISTS "Public likes are viewable by everyone" ON public.post_likes;
CREATE POLICY "Public likes are viewable by everyone" ON public.post_likes
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can insert likes" ON public.post_likes;
CREATE POLICY "Users can insert likes" ON public.post_likes
    FOR INSERT WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Users can delete likes" ON public.post_likes;
CREATE POLICY "Users can delete likes" ON public.post_likes
    FOR DELETE USING (auth.uid() = user_id);

-- 3. Create Functions for Likes (RPC)
CREATE OR REPLACE FUNCTION increment_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = likes_count + 1
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

CREATE OR REPLACE FUNCTION decrement_likes(post_id UUID)
RETURNS VOID AS $$
BEGIN
  UPDATE public.posts
  SET likes_count = GREATEST(likes_count - 1, 0)
  WHERE id = post_id;
END;
$$ LANGUAGE plpgsql;

-- 4. Fix Profile Visibility (Crucial for Community Feed to show authors)
-- Enables public read access to user profiles so posts show avatar/name
DROP POLICY IF EXISTS "Users can view their own profile" ON public.zetsuguide_user_profiles;

CREATE POLICY "Profiles are viewable by everyone" ON public.zetsuguide_user_profiles
    FOR SELECT USING (true);
