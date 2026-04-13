-- ============================================================
-- Community Hashtag Auto-Extraction Trigger
-- Automatically extracts #hashtags from post content,
-- upserts them into community_hashtags, and links via junction table.
-- ============================================================

-- 1. Function: Extract hashtags from a new post
CREATE OR REPLACE FUNCTION public.extract_hashtags_from_post()
RETURNS TRIGGER AS $$
DECLARE
  hashtag_match TEXT;
  hashtag_record UUID;
BEGIN
  -- Extract all #hashtag patterns from content (supports alphanumeric + underscore)
  FOR hashtag_match IN
    SELECT DISTINCT lower(m[1])
    FROM regexp_matches(NEW.content, '#([A-Za-z0-9_\u0600-\u06FF]{2,30})', 'g') AS m
  LOOP
    -- Upsert into community_hashtags
    INSERT INTO public.community_hashtags (tag, usage_count, last_used_at)
    VALUES (hashtag_match, 1, NOW())
    ON CONFLICT (tag) DO UPDATE
      SET usage_count = community_hashtags.usage_count + 1,
          last_used_at = NOW()
    RETURNING id INTO hashtag_record;

    -- Link post to hashtag (ignore if already linked)
    INSERT INTO public.community_post_hashtags (post_id, hashtag_id)
    VALUES (NEW.id, hashtag_record)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 2. Create trigger on posts table
DROP TRIGGER IF EXISTS trg_extract_hashtags ON public.posts;
CREATE TRIGGER trg_extract_hashtags
  AFTER INSERT ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.extract_hashtags_from_post();

-- 3. Function: Decrement hashtag counts when a post is deleted
CREATE OR REPLACE FUNCTION public.decrement_hashtags_on_post_delete()
RETURNS TRIGGER AS $$
BEGIN
  -- Decrement usage_count for all hashtags linked to this post
  UPDATE public.community_hashtags
  SET usage_count = GREATEST(usage_count - 1, 0)
  WHERE id IN (
    SELECT hashtag_id FROM public.community_post_hashtags WHERE post_id = OLD.id
  );

  -- Clean up zero-count hashtags (optional, keeps table tidy)
  DELETE FROM public.community_hashtags WHERE usage_count <= 0;

  RETURN OLD;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Create delete trigger
DROP TRIGGER IF EXISTS trg_decrement_hashtags ON public.posts;
CREATE TRIGGER trg_decrement_hashtags
  BEFORE DELETE ON public.posts
  FOR EACH ROW
  EXECUTE FUNCTION public.decrement_hashtags_on_post_delete();

-- 5. Backfill: Extract hashtags from existing posts (run once)
DO $$
DECLARE
  post_record RECORD;
  hashtag_match TEXT;
  hashtag_record UUID;
BEGIN
  FOR post_record IN SELECT id, content FROM public.posts LOOP
    FOR hashtag_match IN
      SELECT DISTINCT lower(m[1])
      FROM regexp_matches(post_record.content, '#([A-Za-z0-9_\u0600-\u06FF]{2,30})', 'g') AS m
    LOOP
      INSERT INTO public.community_hashtags (tag, usage_count, last_used_at)
      VALUES (hashtag_match, 1, NOW())
      ON CONFLICT (tag) DO UPDATE
        SET usage_count = community_hashtags.usage_count + 1,
            last_used_at = NOW()
      RETURNING id INTO hashtag_record;

      INSERT INTO public.community_post_hashtags (post_id, hashtag_id)
      VALUES (post_record.id, hashtag_record)
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;
