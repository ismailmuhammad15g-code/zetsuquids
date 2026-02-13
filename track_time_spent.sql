-- Create table for tracking time spent on guides
CREATE TABLE IF NOT EXISTS public.guide_time_logs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    guide_id BIGINT REFERENCES public.guides(id) ON DELETE CASCADE,
    duration_seconds INTEGER DEFAULT 0,
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, guide_id)
);

-- Enable RLS
ALTER TABLE public.guide_time_logs ENABLE ROW LEVEL SECURITY;

-- Policies

-- Users can view their own time logs
CREATE POLICY "Users can view own time logs"
ON public.guide_time_logs FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own time logs
CREATE POLICY "Users can insert own time logs"
ON public.guide_time_logs FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own time logs
CREATE POLICY "Users can update own time logs"
ON public.guide_time_logs FOR UPDATE
USING (auth.uid() = user_id);

-- Upsert function for easier time tracking
CREATE OR REPLACE FUNCTION public.track_guide_time(
    p_guide_id BIGINT,
    p_duration_add INTEGER
)
RETURNS VOID AS $$
BEGIN
    INSERT INTO public.guide_time_logs (user_id, guide_id, duration_seconds)
    VALUES (auth.uid(), p_guide_id, p_duration_add)
    ON CONFLICT (user_id, guide_id)
    DO UPDATE SET
        duration_seconds = public.guide_time_logs.duration_seconds + EXCLUDED.duration_seconds,
        last_updated = now();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
