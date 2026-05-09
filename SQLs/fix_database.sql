-- =========================================================================================
-- ZETSUGUIDE DATABASE FIX SCRIPT
-- =========================================================================================
-- Execute this script in your Supabase SQL Editor to resolve the following issues:
-- 1. Community reply bug (RLS violation during notification trigger)
-- 2. Staff Console showing 0 guides / AI guide save failure (Missing columns)
-- =========================================================================================

BEGIN;

-- ==========================================
-- FIX 1: Add missing columns to 'guides' table
-- ==========================================
-- This prevents the "Undefined Column" error when publishing a guide via UI or AI.
-- If these columns already exist, this command safely skips them.
ALTER TABLE guides ADD COLUMN IF NOT EXISTS author_id UUID;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS cover_image TEXT;
ALTER TABLE guides ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'Development';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS difficulty TEXT DEFAULT 'Beginner';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS estimated_time TEXT DEFAULT '5 mins';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS markdown TEXT DEFAULT '';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS html_content TEXT DEFAULT '';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS css_content TEXT DEFAULT '';
ALTER TABLE guides ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';

-- ==========================================
-- FIX 2: Fix Community Triggers (Security Definer)
-- ==========================================
-- By adding "SECURITY DEFINER", the triggers will execute with the privileges of the 
-- function creator (admin), allowing them to bypass RLS and insert notifications for 
-- the post author regardless of who is currently leaving the comment/like.

-- 2a. Update Comment Notification Trigger
CREATE OR REPLACE FUNCTION notify_post_comment() 
RETURNS TRIGGER 
SECURITY DEFINER -- <== THIS IS THE CRITICAL FIX
AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO community_notifications (user_id, actor_id, type, post_id)
    VALUES ((SELECT user_id FROM posts WHERE id = NEW.post_id), NEW.user_id, 'comment', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2b. Update Like Notification Trigger
CREATE OR REPLACE FUNCTION notify_post_like() 
RETURNS TRIGGER 
SECURITY DEFINER -- <== THIS IS THE CRITICAL FIX
AS $$
BEGIN
  IF NEW.user_id != (SELECT user_id FROM posts WHERE id = NEW.post_id) THEN
    INSERT INTO community_notifications (user_id, actor_id, type, post_id)
    VALUES ((SELECT user_id FROM posts WHERE id = NEW.post_id), NEW.user_id, 'like', NEW.post_id);
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

COMMIT;

-- SUCCESS: Database patch completed.

