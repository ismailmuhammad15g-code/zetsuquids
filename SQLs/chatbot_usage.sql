-- Create table for tracking chatbot usage
create table if not exists public.user_chatbot_usage (
  user_id uuid references auth.users not null primary key,
  tokens_left int default 3,
  last_reset_at timestamptz default now(),
  created_at timestamptz default now()
);

-- Enable RLS
alter table public.user_chatbot_usage enable row level security;

-- Policies
create policy "Users can view their own usage"
  on public.user_chatbot_usage for select
  using (auth.uid() = user_id);

create policy "Users can insert their own usage"
  on public.user_chatbot_usage for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own usage"
  on public.user_chatbot_usage for update
  using (auth.uid() = user_id);

-- Optional: Create a function to auto-reset (cleaner than client-side, but client-side is faster for now)
-- We will stick to client-side "lazy reset" for simplicity as requested, but this table schema supports it.
