-- Drop policy if it exists to allow recreating it
drop policy if exists "Users can view their own credits" on zetsuguide_credits;

-- Create zetsuguide_credits table if it doesn't exist
-- Note: If table already exists with bigint ID, this creation is skipped, but we must ensure policy still works
create table if not exists zetsuguide_credits (
  id uuid default gen_random_uuid() primary key,
  user_email text unique not null,
  credits integer default 10 not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table zetsuguide_credits enable row level security;

-- Policies
-- Updated to remove "auth.uid() = id" which causes errors if id is bigint
create policy "Users can view their own credits"
  on zetsuguide_credits for select
  using (user_email = auth.jwt()->>'email');

-- Service role can do anything
drop policy if exists "Service role full access" on zetsuguide_credits;
create policy "Service role full access"
  on zetsuguide_credits
  using (true)
  with check (true);

-- Insert default credits for existing users
insert into zetsuguide_credits (user_email, credits)
select email, 20 from auth.users
on conflict (user_email) do nothing;
