create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email varchar(256) not null,
  email_lower varchar(256) not null unique,
  password_hash text not null,
  name text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists email_verifications (
  id uuid primary key default gen_random_uuid(),
  email_lower varchar(256) not null,
  purpose text not null check (purpose in ('register', 'reset_password')),
  code_hash text not null,
  attempts integer not null default 0,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists auth_attempts (
  id uuid primary key default gen_random_uuid(),
  ip text not null,
  email_hash text,
  kind text not null check (kind in ('send_code', 'register', 'login', 'reset_password')),
  attempted_at timestamptz not null default now()
);

create index if not exists email_verifications_lookup_idx on email_verifications (email_lower, purpose, created_at desc);
create index if not exists auth_attempts_rate_limit_idx on auth_attempts (kind, ip, attempted_at desc);

-- The application currently has no accounts or favorites. Clear Neon Auth identifiers
-- before changing the application-owned profile key to a UUID.
delete from article_favorites;
delete from profiles;
alter table profiles alter column auth_user_id type uuid using auth_user_id::uuid;
alter table profiles add constraint profiles_auth_user_id_fkey foreign key (auth_user_id) references users(id) on delete cascade;
