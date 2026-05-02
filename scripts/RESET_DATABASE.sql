-- ============================================================================
-- 🔥 SUPABASE DATABASE ATOMIC RESET SCRIPT 🔥
-- ============================================================================
-- This script PERMANENTLY DELETES ALL DATA from all tables
-- WARNING: THIS ACTION CANNOT BE UNDONE!
-- 
-- How to use:
-- 1. Go to Supabase Dashboard → SQL Editor
-- 2. Copy-paste this entire script
-- 3. Click Execute
-- 4. Confirm deletion when prompted
-- 
-- ============================================================================

-- Security: Show what will be deleted
DO $$
DECLARE
    total_rows INTEGER := 0;
BEGIN
    -- Count all rows before deletion
    SELECT COALESCE(SUM(n_live_tup), 0) INTO total_rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public';
    
    RAISE NOTICE '⚠️  TOTAL ROWS BEFORE DELETION: %', total_rows;
    RAISE NOTICE 'WARNING: This will DELETE ALL DATA in % rows!', total_rows;
END $$;

-- ============================================================================
-- DELETION STRATEGY
-- ============================================================================
-- Delete in this order to respect foreign key constraints:
-- 1. Delete from dependent tables first
-- 2. Delete from parent tables last
-- 
-- This ensures no foreign key violations during deletion
-- ============================================================================

-- Temporarily disable foreign key constraints
ALTER TABLE IF EXISTS post_comments DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS post_likes DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS post_bookmarks DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_post_hashtags DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_poll_votes DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_poll_options DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_polls DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_comments DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_ratings DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_inline_comments DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_versions DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_views DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_time_logs DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS user_guide_interactions DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_members DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_messages DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_conversations DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_notifications DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS support_messages DISABLE TRIGGER ALL;
ALTER TABLE IF EXISTS support_conversations DISABLE TRIGGER ALL;

-- ============================================================================
-- PHASE 1: DELETE FROM DEPENDENT TABLES (no foreign key dependencies)
-- ============================================================================

DO $$
BEGIN
    DELETE FROM public.community_poll_votes WHERE true;
    RAISE NOTICE '✅ Deleted from community_poll_votes';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_poll_votes: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.community_poll_options WHERE true;
    RAISE NOTICE '✅ Deleted from community_poll_options';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_poll_options: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.community_polls WHERE true;
    RAISE NOTICE '✅ Deleted from community_polls';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_polls: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.community_post_hashtags WHERE true;
    RAISE NOTICE '✅ Deleted from community_post_hashtags';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_post_hashtags: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.community_follows WHERE true;
    RAISE NOTICE '✅ Deleted from community_follows';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_follows: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.community_notifications WHERE true;
    RAISE NOTICE '✅ Deleted from community_notifications';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_notifications: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.post_bookmarks WHERE true;
    RAISE NOTICE '✅ Deleted from post_bookmarks';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  post_bookmarks: Table may not exist or is empty';
END $$;

-- ============================================================================
-- PHASE 2: DELETE FROM POSTS & COMMENTS
-- ============================================================================

DO $$
BEGIN
    DELETE FROM public.post_likes WHERE true;
    RAISE NOTICE '✅ Deleted from post_likes';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  post_likes: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.post_comments WHERE true;
    RAISE NOTICE '✅ Deleted from post_comments';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  post_comments: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.posts WHERE true;
    RAISE NOTICE '✅ Deleted from posts';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  posts: Table may not exist or is empty';
END $$;

-- ============================================================================
-- PHASE 3: DELETE FROM COMMUNITY FEATURES
-- ============================================================================

DO $$
BEGIN
    DELETE FROM public.community_members WHERE true;
    RAISE NOTICE '✅ Deleted from community_members';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_members: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.community_messages WHERE true;
    RAISE NOTICE '✅ Deleted from community_messages';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_messages: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.community_conversations WHERE true;
    RAISE NOTICE '✅ Deleted from community_conversations';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_conversations: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.community_groups WHERE true;
    RAISE NOTICE '✅ Deleted from community_groups';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_groups: Table may not exist or is empty';
END $$;

-- ============================================================================
-- PHASE 4: DELETE FROM GUIDE-RELATED TABLES
-- ============================================================================

DO $$
BEGIN
    DELETE FROM public.guide_versions WHERE true;
    RAISE NOTICE '✅ Deleted from guide_versions';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  guide_versions: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.guide_inline_comments WHERE true;
    RAISE NOTICE '✅ Deleted from guide_inline_comments';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  guide_inline_comments: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.guide_ratings WHERE true;
    RAISE NOTICE '✅ Deleted from guide_ratings';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  guide_ratings: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.guide_comments WHERE true;
    RAISE NOTICE '✅ Deleted from guide_comments';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  guide_comments: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.guide_time_logs WHERE true;
    RAISE NOTICE '✅ Deleted from guide_time_logs';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  guide_time_logs: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.guide_views WHERE true;
    RAISE NOTICE '✅ Deleted from guide_views';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  guide_views: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.user_guide_interactions WHERE true;
    RAISE NOTICE '✅ Deleted from user_guide_interactions';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  user_guide_interactions: Table may not exist or is empty';
END $$;

-- ============================================================================
-- PHASE 5: DELETE FROM USER & ACTIVITY TABLES
-- ============================================================================

DO $$
BEGIN
    DELETE FROM public.user_follows WHERE true;
    RAISE NOTICE '✅ Deleted from user_follows';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  user_follows: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.claimed_rewards WHERE true;
    RAISE NOTICE '✅ Deleted from claimed_rewards';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  claimed_rewards: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.user_chatbot_usage WHERE true;
    RAISE NOTICE '✅ Deleted from user_chatbot_usage';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  user_chatbot_usage: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.zetsuguide_conversations WHERE true;
    RAISE NOTICE '✅ Deleted from zetsuguide_conversations';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  zetsuguide_conversations: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.zetsuguide_usage_logs WHERE true;
    RAISE NOTICE '✅ Deleted from zetsuguide_usage_logs';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  zetsuguide_usage_logs: Table may not exist or is empty';
END $$;

-- ============================================================================
-- PHASE 6: DELETE FROM SUPPORT SYSTEM
-- ============================================================================

DO $$
BEGIN
    DELETE FROM public.support_messages WHERE true;
    RAISE NOTICE '✅ Deleted from support_messages';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  support_messages: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.support_conversations WHERE true;
    RAISE NOTICE '✅ Deleted from support_conversations';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  support_conversations: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.bug_reports WHERE true;
    RAISE NOTICE '✅ Deleted from bug_reports';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  bug_reports: Table may not exist or is empty';
END $$;

-- ============================================================================
-- PHASE 7: DELETE FROM UI & LOGGING
-- ============================================================================

DO $$
BEGIN
    DELETE FROM public.ui_component_likes WHERE true;
    RAISE NOTICE '✅ Deleted from ui_component_likes';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  ui_component_likes: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.ui_components WHERE true;
    RAISE NOTICE '✅ Deleted from ui_components';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  ui_components: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.usage_logs WHERE true;
    RAISE NOTICE '✅ Deleted from usage_logs';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  usage_logs: Table may not exist or is empty';
END $$;

-- ============================================================================
-- PHASE 8: DELETE FROM CREDITS & SYSTEM
-- ============================================================================

DO $$
BEGIN
    DELETE FROM public.zetsuguide_referrals WHERE true;
    RAISE NOTICE '✅ Deleted from zetsuguide_referrals';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  zetsuguide_referrals: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.zetsuguide_credits WHERE true;
    RAISE NOTICE '✅ Deleted from zetsuguide_credits';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  zetsuguide_credits: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.zetsuguide_user_profiles WHERE true;
    RAISE NOTICE '✅ Deleted from zetsuguide_user_profiles';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  zetsuguide_user_profiles: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.zetsuguide_ads WHERE true;
    RAISE NOTICE '✅ Deleted from zetsuguide_ads';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  zetsuguide_ads: Table may not exist or is empty';
END $$;

DO $$
BEGIN
    DELETE FROM public.community_hashtags WHERE true;
    RAISE NOTICE '✅ Deleted from community_hashtags';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  community_hashtags: Table may not exist or is empty';
END $$;

-- ============================================================================
-- PHASE 9: DELETE FROM MAIN GUIDES TABLE (LAST!)
-- ============================================================================

DO $$
BEGIN
    DELETE FROM public.guides WHERE true;
    RAISE NOTICE '✅ Deleted from guides (MAIN TABLE)';
EXCEPTION WHEN OTHERS THEN
    RAISE NOTICE '⏭️  guides: Table may not exist or is empty';
END $$;

-- ============================================================================
-- RE-ENABLE TRIGGERS
-- ============================================================================

ALTER TABLE IF EXISTS post_comments ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS post_likes ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS post_bookmarks ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_post_hashtags ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_poll_votes ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_poll_options ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_polls ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_comments ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_ratings ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_inline_comments ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_versions ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_views ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS guide_time_logs ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS user_guide_interactions ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_members ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_messages ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_conversations ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS community_notifications ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS support_messages ENABLE TRIGGER ALL;
ALTER TABLE IF EXISTS support_conversations ENABLE TRIGGER ALL;

-- ============================================================================
-- FINAL VERIFICATION
-- ============================================================================

DO $$
DECLARE
    total_rows INTEGER := 0;
BEGIN
    -- Count remaining rows
    SELECT COALESCE(SUM(n_live_tup), 0) INTO total_rows
    FROM pg_stat_user_tables
    WHERE schemaname = 'public';
    
    IF total_rows = 0 THEN
        RAISE NOTICE '🎉 SUCCESS! Database is now completely empty!';
        RAISE NOTICE '✨ All % tables have been cleared!', (
            SELECT COUNT(*) FROM information_schema.tables 
            WHERE table_schema = 'public'
        );
    ELSE
        RAISE NOTICE '⚠️  WARNING: Database still contains % rows', total_rows;
    END IF;
END $$;

-- End of script
RAISE NOTICE '✅ Database reset script completed!';
