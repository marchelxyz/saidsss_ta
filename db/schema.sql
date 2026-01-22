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
  source_page text,
  status text default 'new',
  stage text default 'new',
  notes text,
  analysis_status text default 'pending',
  analysis_summary text,
  analysis_json jsonb,
  analyzed_at timestamptz,
  created_at timestamptz default now()
);

alter table leads
  add column if not exists source_page text;

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

create table if not exists lead_tags (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  color text,
  created_at timestamptz default now()
);

create table if not exists lead_tag_map (
  lead_id uuid references leads(id) on delete cascade,
  tag_id uuid references lead_tags(id) on delete cascade,
  primary key (lead_id, tag_id)
);

create table if not exists lead_tasks (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid references leads(id) on delete cascade,
  title text not null,
  status text default 'open',
  due_date date,
  assignee_id uuid,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists team_members (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  role text,
  email text,
  phone text,
  active boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists lead_stages (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

insert into lead_stages (name, sort_order)
values ('new', 1), ('qualification', 2), ('proposal', 3), ('negotiation', 4), ('won', 5), ('lost', 6)
on conflict (name) do nothing;

create table if not exists audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor text,
  action text not null,
  entity_type text,
  entity_id uuid,
  payload jsonb,
  created_at timestamptz default now()
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

create table if not exists site_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  page_type text default 'custom',
  niche text,
  meta_description text,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists site_blocks (
  id uuid primary key default gen_random_uuid(),
  page_id uuid references site_pages(id) on delete cascade,
  block_type text not null,
  sort_order int default 0,
  content jsonb default '{}'::jsonb,
  style jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index if not exists site_pages_type_idx on site_pages (page_type);
create index if not exists site_pages_slug_idx on site_pages (slug);
create index if not exists site_blocks_page_idx on site_blocks (page_id, sort_order);
