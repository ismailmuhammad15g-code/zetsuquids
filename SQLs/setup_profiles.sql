-- Create table for storing user profile details
create table if not exists public.zetsuguide_user_profiles (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade,
  user_email text not null,
  account_type text check (account_type in ('individual', 'company')),
  company_size text,
  avatar_url text,
  referral_source text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique(user_email)
);

-- Enable RLS
alter table public.zetsuguide_user_profiles enable row level security;

-- Policies
create policy "Users can view their own profile"
  on public.zetsuguide_user_profiles for select
  using (auth.jwt() ->> 'email' = user_email);

create policy "Users can insert their own profile"
  on public.zetsuguide_user_profiles for insert
  with check (auth.jwt() ->> 'email' = user_email);

create policy "Users can update their own profile"
  on public.zetsuguide_user_profiles for update
  using (auth.jwt() ->> 'email' = user_email);
