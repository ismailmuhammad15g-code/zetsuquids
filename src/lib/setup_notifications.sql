-- Migration script to create the zetsu_notifications table

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.zetsu_notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    actor_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
    actor_name TEXT NOT NULL, -- e.g., 'System', 'Staff', 'John Doe'
    type TEXT NOT NULL, -- e.g., 'system', 'approved', 'rejected', 'published', 'message', 'update'
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    link TEXT, -- Optional URL to redirect to
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Create indexes for performance
CREATE INDEX IF NOT EXISTS zetsu_notifications_user_id_idx ON public.zetsu_notifications(user_id);
CREATE INDEX IF NOT EXISTS zetsu_notifications_created_at_idx ON public.zetsu_notifications(created_at DESC);

-- 3. Enable Row Level Security (RLS)
ALTER TABLE public.zetsu_notifications ENABLE ROW LEVEL SECURITY;

-- 4. Create Policies

-- Users can only view their own notifications
CREATE POLICY "Users can view their own notifications"
    ON public.zetsu_notifications
    FOR SELECT
    USING (auth.uid() = user_id);

-- Users can only update their own notifications (e.g., mark as read)
CREATE POLICY "Users can update their own notifications"
    ON public.zetsu_notifications
    FOR UPDATE
    USING (auth.uid() = user_id)
    WITH CHECK (auth.uid() = user_id);

-- Users can delete their own notifications (optional, if you want users to clear them)
CREATE POLICY "Users can delete their own notifications"
    ON public.zetsu_notifications
    FOR DELETE
    USING (auth.uid() = user_id);

-- Note: Inserting notifications should generally be done via a secure backend / Edge function 
-- or by authenticated users if they are sending messages to others.
-- For this setup, we will allow authenticated users to insert notifications (e.g., leaving a review triggers a notification to the author).
CREATE POLICY "Authenticated users can insert notifications"
    ON public.zetsu_notifications
    FOR INSERT
    WITH CHECK (auth.role() = 'authenticated');

-- 5. Add to realtime publications
-- This allows clients to listen to changes on this table via Supabase Realtime
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 
    FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND tablename = 'zetsu_notifications'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.zetsu_notifications;
  END IF;
END
$$;
