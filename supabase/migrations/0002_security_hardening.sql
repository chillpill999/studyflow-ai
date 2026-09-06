-- Migration 0002: Security Hardening for Profiles and Document Access Controls
-- Description: Fixes PII exposure vulnerability where any anonymous visitor could query all registered users' emails.

-- 1. Drop overly permissive public read policy
drop policy if exists "Public profiles are viewable by everyone." on public.profiles;

-- 2. Restrict SELECT on profiles so authenticated users can only view their own profile
create policy "Users can view own profile"
  on public.profiles for select
  using ( auth.uid() = id );

-- 3. Ensure Row Level Security is explicitly forced
alter table public.profiles enable row level security;
alter table public.documents enable row level security;
