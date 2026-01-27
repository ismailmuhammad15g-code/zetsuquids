-- Fix Referral Credits Bug
-- This script fixes issues where referrers weren't receiving credits

-- 1. Ensure all referrals are properly recorded with correct email casing
UPDATE zetsuguide_credits
SET user_email = LOWER(user_email)
WHERE user_email != LOWER(user_email);

-- 2. Fix any mismatched referrer emails (lowercase comparison)
UPDATE zetsuguide_credits
SET referred_by = LOWER(referred_by)
WHERE referred_by IS NOT NULL AND referred_by != LOWER(referred_by);

-- 3. Recalculate total_referrals based on actual referral records in zetsuguide_referrals table
-- First, update counts from referrals table
UPDATE zetsuguide_credits c
SET total_referrals = (
    SELECT COUNT(*)
    FROM zetsuguide_referrals
    WHERE LOWER(referrer_email) = LOWER(c.user_email)
)
WHERE EXISTS (
    SELECT 1 FROM zetsuguide_referrals
    WHERE LOWER(referrer_email) = LOWER(c.user_email)
);

-- 4. Add bonus credits to referrers who are missing them
-- For each completed referral that doesn't have corresponding credit bonus
WITH missing_referrer_bonuses AS (
    SELECT DISTINCT
        LOWER(r.referrer_email) as referrer_email,
        COUNT(*) as referral_count
    FROM zetsuguide_referrals r
    GROUP BY LOWER(r.referrer_email)
)
UPDATE zetsuguide_credits c
SET
    credits = (
        SELECT
            COALESCE(c.credits, 0) + (mrb.referral_count * 5)
        FROM missing_referrer_bonuses mrb
        WHERE LOWER(mrb.referrer_email) = LOWER(c.user_email)
    )
FROM missing_referrer_bonuses mrb
WHERE LOWER(c.user_email) = LOWER(mrb.referrer_email)
AND c.credits < (mrb.referral_count * 5);

-- 5. Create table for real-time referral notifications (if not exists)
CREATE TABLE IF NOT EXISTS public.referral_notifications (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    referrer_email text NOT NULL,
    referred_email text NOT NULL,
    referrer_username text,
    credit_amount integer DEFAULT 5,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()),
    read boolean DEFAULT false
);

-- Enable RLS for notifications
ALTER TABLE public.referral_notifications ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own referral notifications
CREATE POLICY "Users can view their referral notifications"
    ON public.referral_notifications FOR SELECT
    USING (auth.jwt() ->> 'email' = referrer_email);

-- Policy: Anyone can insert notifications (for system use)
CREATE POLICY "System can insert referral notifications"
    ON public.referral_notifications FOR INSERT
    WITH CHECK (true);

-- Create index for efficient queries
CREATE INDEX IF NOT EXISTS idx_referral_notifications_referrer
ON public.referral_notifications (referrer_email);

CREATE INDEX IF NOT EXISTS idx_referral_notifications_created
ON public.referral_notifications (created_at DESC);

-- 6. Create trigger to auto-insert notification when referral is completed
CREATE OR REPLACE FUNCTION notify_referrer_bonus()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO public.referral_notifications (referrer_email, referred_email, credit_amount)
        VALUES (LOWER(NEW.referrer_email), LOWER(NEW.referred_email), 5)
        ON CONFLICT DO NOTHING;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_referral_notification ON zetsuguide_referrals;
CREATE TRIGGER trigger_referral_notification
AFTER UPDATE ON zetsuguide_referrals
FOR EACH ROW
EXECUTE FUNCTION notify_referrer_bonus();

-- 7. Verify the fix by checking a user's total credits
-- SELECT user_email, credits, total_referrals FROM zetsuguide_credits WHERE user_email = 'solomismailyt12@gmail.com';
