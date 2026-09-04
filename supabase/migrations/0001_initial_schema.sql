-- Create profiles table linked to auth.users
create table public.profiles (
  id uuid references auth.users on delete cascade not null primary key,
  email text not null,
  username text,
  preference_subject text,
  study_hours numeric default 0,
  streak integer default 0,
  onboarding_completed boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS
alter table public.profiles enable row level security;

create policy "Public profiles are viewable by everyone."
  on profiles for select
  using ( true );

create policy "Users can insert their own profile."
  on profiles for insert
  with check ( auth.uid() = id );

create policy "Users can update own profile."
  on profiles for update
  using ( auth.uid() = id );

-- Create documents table
create table public.documents (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references public.profiles(id) on delete cascade not null,
  filename text not null,
  file_type text not null,
  text_content text not null,
  summary jsonb,
  chunks jsonb,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- Enable RLS for documents
alter table public.documents enable row level security;

create policy "Users can view own documents"
  on documents for select
  using ( auth.uid() = user_id );

create policy "Users can insert own documents"
  on documents for insert
  with check ( auth.uid() = user_id );

create policy "Users can update own documents"
  on documents for update
  using ( auth.uid() = user_id );

create policy "Users can delete own documents"
  on documents for delete
  using ( auth.uid() = user_id );
