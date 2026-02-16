-- Reset reserved_credits for all users
-- This fixes any stuck reservations from failed API calls

UPDATE zetsuguide_credits
SET reserved_credits = 0,
    updated_at = NOW()
WHERE reserved_credits > 0;

-- Check results
SELECT
  user_email,
  credits,
  reserved_credits,
  (credits - reserved_credits) as available_credits
FROM zetsuguide_credits
ORDER BY updated_at DESC
LIMIT 20;
