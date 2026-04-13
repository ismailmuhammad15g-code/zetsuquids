-- Migration for Verified Badges and Followers Count

-- 1. Create or update the function to count followers
-- This is already used by FollowButton.jsx, but ensuring it exists and is optimized
create or replace function get_followers_count_by_email(target_email text)
returns integer
language plpgsql
security definer
as $$
declare
  target_user_id uuid;
  count integer;
begin
  -- Get the user_id from the profiles table based on email
  select user_id into target_user_id
  from zetsuguide_user_profiles
  where lower(user_email) = lower(target_email);

  if target_user_id is null then
    return 0;
  end if;

  -- Count followers from user_follows table
  select count(*) into count
  from user_follows
  where following_id = target_user_id;

  return count;
end;
$$;

-- 2. Optional: Add a materialized view or cached column for performance if needed
-- For now, the RPC is sufficient for the scale.

-- 3. Ensure Admin Profile Exists
-- The admin badge is handled via hardcoded email check in the code, 
-- so we do not strictly need to update account_type in the database.
-- (Skipping update to avoid check constraint violations)

-- 4. Grant execute permission to everyone
grant execute on function get_followers_count_by_email to anon, authenticated, service_role;
