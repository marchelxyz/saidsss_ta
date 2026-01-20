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
  status text default 'new',
  notes text,
  analysis_status text default 'pending',
  analysis_summary text,
  analysis_json jsonb,
  analyzed_at timestamptz,
  created_at timestamptz default now()
);

create table if not exists articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  cover_url text,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists cases (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  industry text,
  challenge text,
  solution text,
  result text,
  metrics text,
  cover_url text,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists site_settings (
  id int primary key default 1,
  telegram text,
  email text,
  phone text,
  address text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into site_settings (id)
values (1)
on conflict (id) do nothing;
