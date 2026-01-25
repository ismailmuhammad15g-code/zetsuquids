-- =============================================
-- DELETE ACCOUNT FUNCTION (COMPLETE FIX)
-- Run this ENTIRE file again.
-- Added "user_chatbot_usage" cleanup to fix Foreign Key error.
-- =============================================

CREATE OR REPLACE FUNCTION delete_user_by_email(target_email TEXT)
RETURNS TEXT AS $$
DECLARE
  target_user_id UUID;
  clean_email TEXT;
  deleted_msg TEXT;
BEGIN
  -- Clean the input email (Trim spaces and lowercase)
  clean_email := LOWER(TRIM(target_email));
  deleted_msg := 'Deleted records for: ' || clean_email;

  -- 1. Try to find the User ID from auth.users
  SELECT id INTO target_user_id
  FROM auth.users
  WHERE LOWER(email) = clean_email;

  -- 2. FORCE DELETE from Public Tables
  
  DELETE FROM public.zetsuguide_referrals 
  WHERE LOWER(referrer_email) = clean_email OR LOWER(referred_email) = clean_email;
  
  DELETE FROM public.zetsuguide_usage_logs 
  WHERE LOWER(user_email) = clean_email;
  
  DELETE FROM public.zetsuguide_credits 
  WHERE LOWER(user_email) = clean_email;
  
  DELETE FROM public.zetsuguide_user_profiles 
  WHERE LOWER(user_email) = clean_email;
  
  -- 3. Delete from User Chatbot Usage (Likely causing the FK Error)
  IF target_user_id IS NOT NULL THEN
    DELETE FROM public.user_chatbot_usage WHERE user_id = target_user_id;
  END IF;

  -- 4. Delete from Auth Users
  IF target_user_id IS NOT NULL THEN
    DELETE FROM auth.users WHERE id = target_user_id;
    RETURN deleted_msg || ' (Authorized Account Deleted)';
  ELSE
    RETURN deleted_msg || ' (Cleaned Public Tables - Auth User was missing)';
  END IF;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- TEST COMMAND:
-- SELECT delete_user_by_email('solomismailyt12@gmail.com');
-- =============================================
