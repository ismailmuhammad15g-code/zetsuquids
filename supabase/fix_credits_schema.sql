-- FIX SCRIPT for zetsuguide_credits table
-- This script safely updates your existing table to support the new features

DO $$ 
BEGIN 
    -- 1. Add user_id column if it is missing
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_credits' AND column_name = 'user_id') THEN
        ALTER TABLE public.zetsuguide_credits ADD COLUMN user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE;
    END IF;

    -- 2. Add user_email column if missing (legacy support)
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'zetsuguide_credits' AND column_name = 'user_email') THEN
        ALTER TABLE public.zetsuguide_credits ADD COLUMN user_email TEXT;
    END IF;

    -- 3. Backfill user_id where possible (match by email)
    UPDATE public.zetsuguide_credits c
    SET user_id = u.id
    FROM auth.users u
    WHERE c.user_email = u.email AND c.user_id IS NULL;

    -- 4. Backfill user_email where possible (if we have id but no email)
    UPDATE public.zetsuguide_credits c
    SET user_email = u.email
    FROM auth.users u
    WHERE c.user_id = u.id AND (c.user_email IS NULL OR c.user_email = '');

END $$;

-- 5. Re-enable RLS and ensure policies exist
ALTER TABLE public.zetsuguide_credits ENABLE ROW LEVEL SECURITY;

-- Drop old policies to prevent conflicts/duplicates
DROP POLICY IF EXISTS "Users can view own credits" ON public.zetsuguide_credits;
DROP POLICY IF EXISTS "Users can view own credits by email" ON public.zetsuguide_credits;

-- Create robust policy using user_id
CREATE POLICY "Users can view own credits" 
ON public.zetsuguide_credits
FOR SELECT 
USING (auth.uid() = user_id OR user_email = auth.jwt() ->> 'email');

-- Function to automatically generate a referral code on insert
CREATE OR REPLACE FUNCTION public.generate_referral_code()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.referral_code IS NULL THEN
        -- Generate a random 8-character alphanumeric code
        NEW.referral_code := upper(substring(md5(random()::text) from 1 for 8));
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to assign referral code on row creation
DROP TRIGGER IF EXISTS on_create_credits ON public.zetsuguide_credits;
CREATE TRIGGER on_create_credits
    BEFORE INSERT ON public.zetsuguide_credits
    FOR EACH ROW
    EXECUTE FUNCTION public.generate_referral_code();
