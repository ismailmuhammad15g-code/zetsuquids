-- ZetsuClaw Jobs Table Migration
-- Run this in your Supabase SQL Editor

-- 1. Create the zetsuclaw_jobs table
CREATE TABLE IF NOT EXISTS public.zetsuclaw_jobs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    user_email TEXT,
    prompt TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'running', 'completed', 'failed')),
    result TEXT,
    model TEXT DEFAULT 'google/gemini-2.0-flash-exp:free',
    run_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    completed_at TIMESTAMP WITH TIME ZONE,
    conversation_id UUID
);

-- 2. Indexes
CREATE INDEX IF NOT EXISTS zetsuclaw_jobs_user_id_idx ON public.zetsuclaw_jobs(user_id);
CREATE INDEX IF NOT EXISTS zetsuclaw_jobs_status_idx ON public.zetsuclaw_jobs(status);
CREATE INDEX IF NOT EXISTS zetsuclaw_jobs_run_at_idx ON public.zetsuclaw_jobs(run_at);

-- 3. Enable RLS
ALTER TABLE public.zetsuclaw_jobs ENABLE ROW LEVEL SECURITY;

-- 4. RLS Policies
CREATE POLICY "Users can view their own jobs"
    ON public.zetsuclaw_jobs FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own jobs"
    ON public.zetsuclaw_jobs FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own jobs"
    ON public.zetsuclaw_jobs FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own jobs"
    ON public.zetsuclaw_jobs FOR DELETE
    USING (auth.uid() = user_id);

-- 5. Enable Realtime (so the client gets live updates)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables
    WHERE pubname = 'supabase_realtime' AND tablename = 'zetsuclaw_jobs'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.zetsuclaw_jobs;
  END IF;
END
$$;
