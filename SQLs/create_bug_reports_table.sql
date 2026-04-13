-- Create bug_reports table
CREATE TABLE IF NOT EXISTS public.bug_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    issue_type TEXT NOT NULL,
    description TEXT NOT NULL,
    improvements TEXT,
    browser_info TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
    notification_shown BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

-- Allow users to insert their own reports
CREATE POLICY "Users can create bug reports" 
ON public.bug_reports FOR INSERT 
WITH CHECK (auth.uid() = user_id);

-- Allow users to view their own reports
CREATE POLICY "Users can view own reports" 
ON public.bug_reports FOR SELECT 
USING (auth.uid() = user_id);

-- Allow admins (service role) to do everything
-- Note: Service role bypasses RLS, but explicit policy is good practice if needed for admin dashboard later
