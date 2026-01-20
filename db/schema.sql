create extension if not exists "pgcrypto";

create table if not exists leads (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text not null,
  email text,
  company text,
  role text,
  summary text,
  message text,
  budget text,
  timeline text,
  created_at timestamptz default now()
);
