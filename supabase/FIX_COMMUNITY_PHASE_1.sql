-- FIX_COMMUNITY_PHASE_1.sql
-- This migration upgrades the database to support X (Twitter) clone features.

-- 1. Upgrade User Profiles (zetsuguide_user_profiles)
-- Adds fields for rich profiles (username, bio, counts).

DO $$
BEGIN
    -- Add username column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_user_profiles' AND column_name = 'username') THEN
        ALTER TABLE public.zetsuguide_user_profiles ADD COLUMN username TEXT UNIQUE;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_user_profiles' AND column_name = 'display_name') THEN
        ALTER TABLE public.zetsuguide_user_profiles ADD COLUMN display_name TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_user_profiles' AND column_name = 'bio') THEN
        ALTER TABLE public.zetsuguide_user_profiles ADD COLUMN bio TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_user_profiles' AND column_name = 'location') THEN
        ALTER TABLE public.zetsuguide_user_profiles ADD COLUMN location TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_user_profiles' AND column_name = 'website') THEN
        ALTER TABLE public.zetsuguide_user_profiles ADD COLUMN website TEXT;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_user_profiles' AND column_name = 'cover_image') THEN
        ALTER TABLE public.zetsuguide_user_profiles ADD COLUMN cover_image TEXT;
    END IF;

    -- Add counters
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_user_profiles' AND column_name = 'followers_count') THEN
        ALTER TABLE public.zetsuguide_user_profiles ADD COLUMN followers_count INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_user_profiles' AND column_name = 'following_count') THEN
        ALTER TABLE public.zetsuguide_user_profiles ADD COLUMN following_count INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_user_profiles' AND column_name = 'is_verified') THEN
        ALTER TABLE public.zetsuguide_user_profiles ADD COLUMN is_verified BOOLEAN DEFAULT false;
    END IF;
END $$;

-- Update existing profiles without username (generate from email)
UPDATE public.zetsuguide_user_profiles
SET
  username = SPLIT_PART(user_email, '@', 1) || '_' || SUBSTRING(id::text, 1, 4),
  display_name = SPLIT_PART(user_email, '@', 1)
WHERE username IS NULL;

-- 2. Create Follows Table
CREATE TABLE IF NOT EXISTS public.community_follows (
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (follower_id, following_id)
);

-- Enable RLS for Follows
ALTER TABLE public.community_follows ENABLE ROW LEVEL SECURITY;

-- Policies for Follows
DROP POLICY IF EXISTS "Public follows are viewable by everyone" ON public.community_follows;
CREATE POLICY "Public follows are viewable by everyone" ON public.community_follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.community_follows;
CREATE POLICY "Users can follow others" ON public.community_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.community_follows;
CREATE POLICY "Users can unfollow" ON public.community_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- 3. Create Hashtags Table
CREATE TABLE IF NOT EXISTS public.community_hashtags (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tag TEXT NOT NULL UNIQUE,
  usage_count INT DEFAULT 0,
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS for Hashtags
ALTER TABLE public.community_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public hashtags are viewable by everyone" ON public.community_hashtags FOR SELECT USING (true);
CREATE POLICY "Authenticated users can create hashtags" ON public.community_hashtags FOR INSERT WITH CHECK (auth.role() = 'authenticated');
CREATE POLICY "Authenticated users can update hashtags" ON public.community_hashtags FOR UPDATE USING (auth.role() = 'authenticated');

-- 4. Create Post Hashtags Junction (Many-to-Many)
CREATE TABLE IF NOT EXISTS public.community_post_hashtags (
  post_id UUID NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  hashtag_id UUID NOT NULL REFERENCES public.community_hashtags(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  PRIMARY KEY (post_id, hashtag_id)
);
ALTER TABLE public.community_post_hashtags ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Public post_hashtags are viewable" ON public.community_post_hashtags FOR SELECT USING (true);
CREATE POLICY "Users can tag posts" ON public.community_post_hashtags FOR INSERT WITH CHECK (auth.role() = 'authenticated');


-- 5. Trigger to update follower counts
CREATE OR REPLACE FUNCTION public.handle_new_follow()
RETURNS TRIGGER AS $$
BEGIN
  -- Increment following_count for the follower
  UPDATE public.zetsuguide_user_profiles
  SET following_count = following_count + 1
  WHERE user_id = NEW.follower_id;

  -- Increment followers_count for the person being followed
  UPDATE public.zetsuguide_user_profiles
  SET followers_count = followers_count + 1
  WHERE user_id = NEW.following_id;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_follow_added
  AFTER INSERT ON public.community_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_follow();

CREATE OR REPLACE FUNCTION public.handle_unfollow()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement following_count for the follower
  UPDATE public.zetsuguide_user_profiles
  SET following_count = GREATEST(0, following_count - 1)
  WHERE user_id = OLD.follower_id;

  -- Decrement followers_count for the person being followed
  UPDATE public.zetsuguide_user_profiles
  SET followers_count = GREATEST(0, followers_count - 1)
  WHERE user_id = OLD.following_id;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_follow_removed
  AFTER DELETE ON public.community_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_unfollow();


-- 6. Helper RPC Functions for Frontend

-- Get Suggested Users (Who to Follow)
-- Returns random users that the current user is NOT following
CREATE OR REPLACE FUNCTION get_suggested_users(limit_count INT)
RETURNS SETOF public.zetsuguide_user_profiles
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.zetsuguide_user_profiles
  WHERE user_id != auth.uid()
  AND user_id NOT IN (
    SELECT following_id
    FROM public.community_follows
    WHERE follower_id = auth.uid()
  )
  ORDER BY random()
  LIMIT limit_count;
$$;

-- Get Trending Hashtags
CREATE OR REPLACE FUNCTION get_top_trends(limit_count INT)
RETURNS TABLE (
  tag TEXT,
  posts_count INT,
  unique_id UUID
)
LANGUAGE sql
STABLE
AS $$
  SELECT tag, usage_count as posts_count, id as unique_id
  FROM public.community_hashtags
  ORDER BY usage_count DESC
  LIMIT limit_count;
$$;

-- Search Users
CREATE OR REPLACE FUNCTION search_users(search_term TEXT)
RETURNS SETOF public.zetsuguide_user_profiles
LANGUAGE sql
STABLE
AS $$
  SELECT *
  FROM public.zetsuguide_user_profiles
  WHERE username ILIKE '%' || search_term || '%'
  OR display_name ILIKE '%' || search_term || '%'
  LIMIT 20;
$$;
