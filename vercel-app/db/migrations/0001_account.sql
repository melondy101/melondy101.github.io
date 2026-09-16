create extension if not exists pgcrypto;

create table if not exists profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id text not null unique,
  last_name text not null,
  nickname text not null,
  handle text not null unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists article_favorites (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references profiles(id) on delete cascade,
  article_slug text not null,
  created_at timestamptz not null default now(),
  unique(profile_id, article_slug)
);
