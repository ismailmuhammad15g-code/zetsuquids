-- Secure function to claim credits for tasks
-- This function is called via RPC and performs server-side verification of task completion
-- It prevents "fake" claims by verifying data directly in the database tables

create or replace function claim_task_reward(
  task_id text,
  user_id uuid
)
returns json
language plpgsql
security definer
as $$
declare
  reward_amount int;
  current_credits int;
  already_claimed boolean;
  claim_key text;
  is_verified boolean;
  verification_msg text;
begin
  -- 1. Define Rewards
  if task_id = 'focus_reader' then
    reward_amount := 10;
  elsif task_id = 'bug_hunter' then
    reward_amount := 10;
  elsif task_id = 'daily_login' then
    reward_amount := 5;
  else
    return json_build_object('success', false, 'message', 'Invalid task ID');
  end if;

  -- 2. Define Claim Key (Frequency Control)
  if task_id = 'daily_login' then
    claim_key := 'claim_' || task_id || '_' || user_id || '_' || to_char(now(), 'YYYY-MM-DD');
  else
    -- Monthly claim for others
    claim_key := 'claim_' || task_id || '_' || user_id || '_' || to_char(now(), 'YYYY-MM');
  end if;

  -- 3. Check if already claimed
  -- Create table if needed (idempotent)
  create table if not exists claimed_rewards (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id),
    task_id text not null,
    claim_key text not null unique,
    amount int not null,
    created_at timestamptz default now()
  );

  select exists(select 1 from claimed_rewards where claimed_rewards.claim_key = claim_task_reward.claim_key) into already_claimed;

  if already_claimed then
    return json_build_object('success', false, 'message', 'Reward already claimed for this period', 'code', 'ALREADY_CLAIMED');
  end if;

  -- 4. SERVER-SIDE VERIFICATION
  -- This is the crucial security step. We do not trust the client.
  is_verified := false;

  if task_id = 'focus_reader' then
     -- Verify: User has spent > 300 seconds (5 mins) on at least one guide
     select exists (
       select 1 from guide_time_logs
       where guide_time_logs.user_id = claim_task_reward.user_id
       and guide_time_logs.duration_seconds >= 300
     ) into is_verified;
     verification_msg := 'You need to read a guide for at least 5 minutes.';

  elsif task_id = 'bug_hunter' then
     -- Verify: User has submitted at least one bug report
     select exists (
       select 1 from bug_reports
       where bug_reports.user_id = claim_task_reward.user_id
     ) into is_verified;
     verification_msg := 'You need to submit a bug report first.';

  elsif task_id = 'daily_login' then
     -- Verify: Intrinsically true if they are authenticated to call this function
     is_verified := true;
  end if;

  if not is_verified then
     return json_build_object('success', false, 'message', verification_msg, 'code', 'REQUIREMENT_NOT_MET');
  end if;

  -- 5. Award Reward
  begin
      -- Insert claim record
      insert into claimed_rewards (user_id, task_id, claim_key, amount)
      values (user_id, task_id, claim_key, reward_amount);

      -- Update user credits
      update zetsuguide_credits
      set credits = coalesce(credits, 0) + reward_amount,
          updated_at = now()
      where zetsuguide_credits.user_id = claim_task_reward.user_id
         or zetsuguide_credits.user_email = (select email from auth.users where id = claim_task_reward.user_id);

      -- Handle case where user might not be in credits table yet
      if not found then
          -- Try to insert if missing (though usually done at signup)
          insert into zetsuguide_credits (user_id, user_email, credits)
          select claim_task_reward.user_id, email, reward_amount
          from auth.users where id = claim_task_reward.user_id;
      end if;

      -- Get new balance
      select credits into current_credits from zetsuguide_credits
      where zetsuguide_credits.user_id = claim_task_reward.user_id
         or zetsuguide_credits.user_email = (select email from auth.users where id = claim_task_reward.user_id);

      return json_build_object('success', true, 'new_balance', current_credits, 'reward', reward_amount);

  exception when unique_violation then
      return json_build_object('success', false, 'message', 'Reward already claimed (concurrency)', 'code', 'ALREADY_CLAIMED');
  end;
end;
$$;
