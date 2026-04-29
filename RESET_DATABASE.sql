-- ========================================================
-- ZETSUQUIDS DATABASE RESET SCRIPT
-- RUN THIS IN SUPABASE SQL EDITOR TO CLEAR EVERYTHING
-- ========================================================

-- 1. Delete all likes/interactions first (due to foreign keys)
DELETE FROM ui_component_likes;

-- 2. Delete all UI components
DELETE FROM ui_components;

-- 3. Reset sequences (if any)
-- ALTER SEQUENCE ui_components_id_seq RESTART WITH 1;

-- 4. Confirm deletion
SELECT count(*) as total_components_left FROM ui_components;

-- ========================================================
-- CLEANUP COMPLETE - YOU CAN NOW START WITH A FRESH REPO
-- ========================================================
