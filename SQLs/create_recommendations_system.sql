-- ============================================
-- GUIDE RECOMMENDATIONS SYSTEM
-- ============================================

-- 1. Create user_guide_interactions table to track all user interactions
CREATE TABLE IF NOT EXISTS user_guide_interactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  guide_id UUID NOT NULL,
  guide_slug TEXT NOT NULL,
  interaction_type TEXT NOT NULL, -- 'view', 'read_5min', 'read_10min', 'comment', 'rate'
  interaction_score INTEGER DEFAULT 1, -- weight for recommendation algorithm
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_guide_interactions_user_email ON user_guide_interactions(user_email);
CREATE INDEX IF NOT EXISTS idx_user_guide_interactions_guide_slug ON user_guide_interactions(guide_slug);
CREATE INDEX IF NOT EXISTS idx_user_guide_interactions_type ON user_guide_interactions(interaction_type);
CREATE INDEX IF NOT EXISTS idx_user_guide_interactions_created_at ON user_guide_interactions(created_at DESC);

-- Enable RLS
ALTER TABLE user_guide_interactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies (Drop existing first to avoid conflicts)
DROP POLICY IF EXISTS "Users can view their own interactions" ON user_guide_interactions;
CREATE POLICY "Users can view their own interactions"
  ON user_guide_interactions
  FOR SELECT
  USING (auth.uid() = user_id OR auth.jwt()->>'email' = user_email);

DROP POLICY IF EXISTS "Users can insert their own interactions" ON user_guide_interactions;
CREATE POLICY "Users can insert their own interactions"
  ON user_guide_interactions
  FOR INSERT
  WITH CHECK (auth.uid() = user_id OR auth.jwt()->>'email' = user_email);

DROP POLICY IF EXISTS "Users can update their own interactions" ON user_guide_interactions;
CREATE POLICY "Users can update their own interactions"
  ON user_guide_interactions
  FOR UPDATE
  USING (auth.uid() = user_id OR auth.jwt()->>'email' = user_email);

-- 2. Function to record user interaction
CREATE OR REPLACE FUNCTION record_guide_interaction(
  p_user_email TEXT,
  p_guide_slug TEXT,
  p_interaction_type TEXT,
  p_interaction_score INTEGER DEFAULT 1
)
RETURNS VOID AS $$
DECLARE
  v_user_id UUID;
  v_guide_id UUID;
BEGIN
  -- Get user_id from auth.users
  SELECT id INTO v_user_id
  FROM auth.users
  WHERE email = p_user_email
  LIMIT 1;

  -- Get guide_id from guides
  SELECT id INTO v_guide_id
  FROM guides
  WHERE slug = p_guide_slug
  LIMIT 1;

  -- Insert or update interaction
  IF v_user_id IS NOT NULL AND v_guide_id IS NOT NULL THEN
    INSERT INTO user_guide_interactions (
      user_id,
      user_email,
      guide_id,
      guide_slug,
      interaction_type,
      interaction_score
    )
    VALUES (
      v_user_id,
      p_user_email,
      v_guide_id,
      p_guide_slug,
      p_interaction_type,
      p_interaction_score
    )
    ON CONFLICT DO NOTHING;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Function to get personalized recommendations for a user
CREATE OR REPLACE FUNCTION get_personalized_recommendations(
  p_user_email TEXT,
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  user_email TEXT,
  author_name TEXT,
  keywords TEXT[],
  created_at TIMESTAMPTZ,
  views_count INTEGER,
  recommendation_score NUMERIC,
  recommendation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  WITH user_interactions AS (
    -- Get all guides the user has interacted with
    SELECT DISTINCT guide_slug, SUM(interaction_score) as total_score
    FROM user_guide_interactions
    WHERE user_guide_interactions.user_email = p_user_email
    GROUP BY guide_slug
  ),
  user_interests AS (
    -- Extract user's interested tags from interacted guides
    SELECT DISTINCT UNNEST(g.keywords) as tag
    FROM guides g
    INNER JOIN user_interactions ui ON g.slug = ui.guide_slug
    WHERE g.keywords IS NOT NULL AND array_length(g.keywords, 1) > 0
  ),
  followed_authors AS (
    -- Get authors the user follows
    SELECT following_email
    FROM user_follows
    WHERE follower_email = p_user_email
  ),
  recommended_guides AS (
    SELECT
      g.slug,
      g.title,
      g.user_email,
      g.author_name,
      g.keywords,
      g.created_at,
      COALESCE(g.views_count, 0)::INTEGER as views_count,
      -- Calculate recommendation score based on multiple factors
      (
        -- Factor 1: Same author (if user follows them) = 10 points
        CASE WHEN EXISTS (SELECT 1 FROM followed_authors fa WHERE fa.following_email = g.user_email)
          THEN 10 ELSE 0 END
        +
        -- Factor 2: Matching tags = 5 points per tag
        (SELECT COUNT(*) * 5
         FROM user_interests ui
         WHERE ui.tag = ANY(g.keywords))
        +
        -- Factor 3: Popular guides (views) = normalized score (0-5)
        LEAST(COALESCE(g.views_count, 0) / 20.0, 5)
        +
        -- Factor 4: Recent guides = 3 points if created in last 30 days
        CASE WHEN g.created_at > NOW() - INTERVAL '30 days'
          THEN 3 ELSE 0 END
        +
        -- Factor 5: Has comments (engagement) = 2 points
        CASE WHEN EXISTS (SELECT 1 FROM guide_comments gc WHERE gc.guide_id = g.id)
          THEN 2 ELSE 0 END
      ) as score,
      -- Determine primary reason for recommendation
      CASE
        WHEN EXISTS (SELECT 1 FROM followed_authors fa WHERE fa.following_email = g.user_email)
          THEN 'From author you follow'
        WHEN (SELECT COUNT(*) FROM user_interests ui WHERE ui.tag = ANY(g.keywords)) > 0
          THEN 'Similar to guides you read'
        WHEN COALESCE(g.views_count, 0) > 50
          THEN 'Popular guide'
        ELSE 'Recommended for you'
      END as reason
    FROM guides g
    WHERE
      -- Exclude guides user already interacted with
      g.slug NOT IN (SELECT guide_slug FROM user_interactions)
  )
  SELECT
    rg.slug::TEXT,
    rg.title::TEXT,
    rg.user_email::TEXT,
    rg.author_name::TEXT,
    rg.keywords::TEXT[],
    rg.created_at,
    rg.views_count,
    rg.score as recommendation_score,
    rg.reason::TEXT as recommendation_reason
  FROM recommended_guides rg
  WHERE rg.score > 0
  ORDER BY rg.score DESC, rg.views_count DESC, rg.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 4. Function to get trending guides (for non-logged in users or fallback)
CREATE OR REPLACE FUNCTION get_trending_guides(
  p_limit INTEGER DEFAULT 6
)
RETURNS TABLE (
  slug TEXT,
  title TEXT,
  user_email TEXT,
  author_name TEXT,
  keywords TEXT[],
  created_at TIMESTAMPTZ,
  views_count INTEGER,
  recommendation_reason TEXT
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    g.slug::TEXT,
    g.title::TEXT,
    g.user_email::TEXT,
    g.author_name::TEXT,
    g.keywords::TEXT[],
    g.created_at,
    COALESCE(g.views_count, 0)::INTEGER as views_count,
    'Trending guide'::TEXT as recommendation_reason
  FROM guides g
  ORDER BY
    -- Weighted score: recent views + recency
    (COALESCE(g.views_count, 0) * 0.7 +
     CASE WHEN g.created_at > NOW() - INTERVAL '7 days' THEN 30 ELSE 0 END) DESC,
    g.created_at DESC
  LIMIT p_limit;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION record_guide_interaction TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_personalized_recommendations TO authenticated, anon;
GRANT EXECUTE ON FUNCTION get_trending_guides TO authenticated, anon;

-- Grant table permissions
GRANT SELECT, INSERT, UPDATE ON user_guide_interactions TO authenticated, anon;

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Recommendations system created successfully!';
  RAISE NOTICE '📊 Tables: user_guide_interactions';
  RAISE NOTICE '🔧 Functions: record_guide_interaction, get_personalized_recommendations, get_trending_guides';
END $$;
