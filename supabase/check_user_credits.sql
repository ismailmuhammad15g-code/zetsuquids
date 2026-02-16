-- Check user credits and reserved credits
-- Replace 'your-email@example.com' with your actual email

SELECT
  user_email,
  credits,
  reserved_credits,
  (credits - reserved_credits) as available_credits,
  updated_at
FROM zetsuguide_credits
WHERE user_email = 'YOUR_EMAIL_HERE';  -- Replace with your email

-- Also check if there are any stuck reservations
SELECT * FROM zetsuguide_credits
ORDER BY updated_at DESC
LIMIT 10;
