-- Use this query to reset your time stats if they are corrupted
-- Run this in the Supabase SQL Editor

-- Option 1: Reset ALL time logs for everyone (careful!)
-- TRUNCATE TABLE public.guide_time_logs;

-- Option 2: Reset time logs for a specific user (You)
-- Replace 'USER_ID_HERE' with your actual User ID from the stats page or auth table
-- DELETE FROM public.guide_time_logs WHERE user_id = 'USER_ID_HERE';

-- Option 3: Reset just the inflated logs (e.g. > 1 hour reading)
-- DELETE FROM public.guide_time_logs WHERE duration_seconds > 3600;

-- Option 4: Just reset everything for the currently logged in user (if running in RLS context like App)
-- DELETE FROM public.guide_time_logs WHERE user_id = auth.uid();

-- For development reset now:
TRUNCATE TABLE public.guide_time_logs;
