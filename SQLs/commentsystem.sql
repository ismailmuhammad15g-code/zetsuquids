-- Create guide_comments table
CREATE TABLE IF NOT EXISTS public.guide_comments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    guide_id BIGINT REFERENCES public.guides(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    parent_id UUID REFERENCES public.guide_comments(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.guide_comments ENABLE ROW LEVEL SECURITY;

-- Create policies

-- Everyone can view comments
CREATE POLICY "Everyone can view comments"
ON public.guide_comments FOR SELECT
USING (true);

-- Authenticated users can insert comments
CREATE POLICY "Authenticated users can insert comments"
ON public.guide_comments FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own comments
CREATE POLICY "Users can update their own comments"
ON public.guide_comments FOR UPDATE
USING (auth.uid() = user_id);

-- Users can delete their own comments
CREATE POLICY "Users can delete their own comments"
ON public.guide_comments FOR DELETE
USING (auth.uid() = user_id);

-- Create a view to easily fetch comments with user profile info
-- security_invoker: true ensures RLS policies of underlying tables are applied based on the current user
CREATE OR REPLACE VIEW public.guide_comments_with_profiles WITH (security_invoker = true) AS
SELECT
    bg.id,
    bg.guide_id,
    bg.user_id,
    bg.parent_id,
    bg.content,
    bg.created_at,
    bg.updated_at,
    p.user_email,
    p.avatar_url,
    coalesce(p.account_type, 'individual') as account_type
FROM
    public.guide_comments bg
LEFT JOIN
    public.zetsuguide_user_profiles p ON bg.user_id = p.user_id;
