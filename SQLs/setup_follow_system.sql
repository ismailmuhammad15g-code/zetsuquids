-- ============================================
-- FOLLOW SYSTEM SETUP
-- Complete setup for user following feature
-- ============================================

-- 1. Ensure followers_count and following_count columns exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'zetsuguide_user_profiles'
                   AND column_name = 'followers_count') THEN
        ALTER TABLE public.zetsuguide_user_profiles
        ADD COLUMN followers_count INT DEFAULT 0;
    END IF;

    IF NOT EXISTS (SELECT 1 FROM information_schema.columns
                   WHERE table_name = 'zetsuguide_user_profiles'
                   AND column_name = 'following_count') THEN
        ALTER TABLE public.zetsuguide_user_profiles
        ADD COLUMN following_count INT DEFAULT 0;
    END IF;
END $$;

-- 2. Create user_follows table (simplified without community prefix)
CREATE TABLE IF NOT EXISTS public.user_follows (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  follower_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  following_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  follower_email TEXT NOT NULL,
  following_email TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE(follower_id, following_id)
);

-- Create index for better performance
CREATE INDEX IF NOT EXISTS idx_user_follows_follower ON public.user_follows(follower_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_following ON public.user_follows(following_id);
CREATE INDEX IF NOT EXISTS idx_user_follows_emails ON public.user_follows(follower_email, following_email);

-- 3. Enable RLS for user_follows
ALTER TABLE public.user_follows ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies for user_follows
DROP POLICY IF EXISTS "Anyone can view follows" ON public.user_follows;
CREATE POLICY "Anyone can view follows" ON public.user_follows
    FOR SELECT USING (true);

DROP POLICY IF EXISTS "Users can follow others" ON public.user_follows;
CREATE POLICY "Users can follow others" ON public.user_follows
    FOR INSERT WITH CHECK (auth.uid() = follower_id);

DROP POLICY IF EXISTS "Users can unfollow" ON public.user_follows;
CREATE POLICY "Users can unfollow" ON public.user_follows
    FOR DELETE USING (auth.uid() = follower_id);

-- 5. Trigger function to update follower counts on new follow
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

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS on_user_follow_added ON public.user_follows;
CREATE TRIGGER on_user_follow_added
  AFTER INSERT ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_follow();

-- 6. Trigger function to update follower counts on unfollow
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

-- Drop old trigger if exists and create new one
DROP TRIGGER IF EXISTS on_user_unfollow ON public.user_follows;
CREATE TRIGGER on_user_unfollow
  AFTER DELETE ON public.user_follows
  FOR EACH ROW EXECUTE FUNCTION public.handle_unfollow();

-- 7. Function to check if user A follows user B
CREATE OR REPLACE FUNCTION public.is_following(
  follower_user_id UUID,
  following_user_id UUID
)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_follows
    WHERE follower_id = follower_user_id
    AND following_id = following_user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Function to get follower count by user_id
CREATE OR REPLACE FUNCTION public.get_followers_count(target_user_id UUID)
RETURNS INT AS $$
DECLARE
  count_result INT;
BEGIN
  SELECT COALESCE(followers_count, 0) INTO count_result
  FROM public.zetsuguide_user_profiles
  WHERE user_id = target_user_id;

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 9. Function to get follower count by email
CREATE OR REPLACE FUNCTION public.get_followers_count_by_email(target_email TEXT)
RETURNS INT AS $$
DECLARE
  count_result INT;
BEGIN
  SELECT COALESCE(followers_count, 0) INTO count_result
  FROM public.zetsuguide_user_profiles
  WHERE user_email = target_email;

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. Function to get following count by email
CREATE OR REPLACE FUNCTION public.get_following_count_by_email(target_email TEXT)
RETURNS INT AS $$
DECLARE
  count_result INT;
BEGIN
  SELECT COALESCE(following_count, 0) INTO count_result
  FROM public.zetsuguide_user_profiles
  WHERE user_email = target_email;

  RETURN COALESCE(count_result, 0);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 11. Recalculate all follower counts (run this once to fix existing data)
CREATE OR REPLACE FUNCTION public.recalculate_follower_counts()
RETURNS void AS $$
BEGIN
  -- Reset all counts to 0 first
  UPDATE public.zetsuguide_user_profiles
  SET followers_count = 0, following_count = 0;

  -- Recalculate following_count
  UPDATE public.zetsuguide_user_profiles p
  SET following_count = (
    SELECT COUNT(*)
    FROM public.user_follows f
    WHERE f.follower_id = p.user_id
  );

  -- Recalculate followers_count
  UPDATE public.zetsuguide_user_profiles p
  SET followers_count = (
    SELECT COUNT(*)
    FROM public.user_follows f
    WHERE f.following_id = p.user_id
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 12. Add RLS policy to allow public viewing of profiles (for follower counts)
DROP POLICY IF EXISTS "Public profiles are viewable" ON public.zetsuguide_user_profiles;
CREATE POLICY "Public profiles are viewable" ON public.zetsuguide_user_profiles
    FOR SELECT USING (true);

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✓ Follow system setup complete!';
  RAISE NOTICE '✓ Table user_follows created';
  RAISE NOTICE '✓ Triggers configured';
  RAISE NOTICE '✓ RLS policies applied';
  RAISE NOTICE '✓ Helper functions created';
  RAISE NOTICE '';
  RAISE NOTICE 'Run SELECT public.recalculate_follower_counts(); to fix existing counts';
END $$;
