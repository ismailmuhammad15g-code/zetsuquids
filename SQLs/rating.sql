-- Drop table if exists to ensure clean slate (since it's new)
drop table if exists guide_ratings;

-- Create guide_ratings table
create table guide_ratings (
  id uuid default gen_random_uuid() primary key,
  guide_id bigint references guides(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  rating numeric not null check (rating >= 0.5 and rating <= 5),
  comment text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null, -- Added updated_at
  
  -- Ensure one rating per user per guide
  unique(guide_id, user_id)
);

-- Enable RLS
alter table guide_ratings enable row level security;

-- Policies
create policy "Anyone can view ratings"
  on guide_ratings for select
  using (true);

create policy "Authenticated users can create ratings"
  on guide_ratings for insert
  with check (auth.uid() = user_id);

create policy "Users can update their own ratings"
  on guide_ratings for update
  using (auth.uid() = user_id);

create policy "Users can delete their own ratings"
  on guide_ratings for delete
  using (auth.uid() = user_id);

-- Create index for faster queries
create index if not exists guide_ratings_guide_id_idx on guide_ratings(guide_id);
create index if not exists guide_ratings_user_id_idx on guide_ratings(user_id);
