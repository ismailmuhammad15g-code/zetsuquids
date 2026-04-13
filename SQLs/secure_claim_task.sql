-- Secure function to claim credits for tasks
-- This function should be called via RPC from the frontend
-- It checks if the task is already claimed and awards credits atomically

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
  result json;
begin
  -- Define rewards for tasks
  if task_id = 'focus_reader' then
    reward_amount := 10;
  elsif task_id = 'bug_hunter' then
    reward_amount := 10;
  elsif task_id = 'daily_login' then
    reward_amount := 5;
  else
    return json_build_object('success', false, 'message', 'Invalid task ID');
  end if;

  -- Generate a unique claim key (e.g., specific to user and task, monthly or one-time)
  -- For Focus Reader, it's monthly. For Bug Hunter, let's say it's per report (handled differently usually)
  -- but here we simplify to monthly for the "Task" view.
  -- For Daily Login, it's daily.

  if task_id = 'daily_login' then
    claim_key := 'claim_' || task_id || '_' || user_id || '_' || to_char(now(), 'YYYY-MM-DD');
  else
    claim_key := 'claim_' || task_id || '_' || user_id || '_' || to_char(now(), 'YYYY-MM');
  end if;

  -- Check if already claimed (using a dedicated claims table would be best, but we can check a logs table or metadata)
  -- For simplicity in this existing schema, we'll check a new table or just assume the frontend checks local storage
  -- AND we check a server-side log if possible.
  -- *Improving Security*: We create a 'claimed_rewards' table if it doesn't exist.

  create table if not exists claimed_rewards (
    id uuid default gen_random_uuid() primary key,
    user_id uuid references auth.users(id),
    task_id text not null,
    claim_key text not null unique,
    amount int not null,
    created_at timestamptz default now()
  );

  -- Check if exists in the new table
  select exists(select 1 from claimed_rewards where claimed_rewards.claim_key = claim_task_reward.claim_key) into already_claimed;

  if already_claimed then
    return json_build_object('success', false, 'message', 'Reward already claimed for this period');
  end if;

  -- Insert claim record
  insert into claimed_rewards (user_id, task_id, claim_key, amount)
  values (user_id, task_id, claim_key, reward_amount);

  -- Update user credits
  -- Assuming zetsuguide_credits table has user_id or email.
  -- The existing code used email, let's try to verify if we have user_id there, if not get email from auth.users

  -- Update credits safely
  update zetsuguide_credits
  set credits = coalesce(credits, 0) + reward_amount,
      updated_at = now()
  where user_id = claim_task_reward.user_id
     or user_email = (select email from auth.users where id = claim_task_reward.user_id);

  -- Get new balance
  select credits into current_credits from zetsuguide_credits
  where user_id = claim_task_reward.user_id
     or user_email = (select email from auth.users where id = claim_task_reward.user_id);

  return json_build_object('success', true, 'new_balance', current_credits, 'reward', reward_amount);

exception when unique_violation then
  return json_build_object('success', false, 'message', 'Reward already claimed (b)');
when others then
  return json_build_object('success', false, 'message', SQLERRM);
end;
$$;
