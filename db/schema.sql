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
  is_lost boolean default false,
  loss_reason_id uuid,
  notes text,
  analysis_status text default 'pending',
  analysis_summary text,
  analysis_json jsonb,
  analyzed_at timestamptz,
  created_at timestamptz default now()
);

alter table leads
  add column if not exists source_page text;
alter table leads
  add column if not exists is_lost boolean default false;
alter table leads
  add column if not exists loss_reason_id uuid;

create table if not exists lead_loss_reasons (
  id uuid primary key default gen_random_uuid(),
  name text unique not null,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table leads
  add constraint leads_loss_reason_fk
  foreign key (loss_reason_id)
  references lead_loss_reasons(id)
  on delete set null;

create index if not exists leads_loss_reason_idx on leads (loss_reason_id);

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
  company_name text,
  provider_name text,
  source_url text,
  country text,
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

alter table cases
  add column if not exists company_name text;
alter table cases
  add column if not exists provider_name text;
alter table cases
  add column if not exists source_url text;
alter table cases
  add column if not exists country text;

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
  company_name text,
  legal_address text,
  inn text,
  ogrn text,
  kpp text,
  policy_url text,
  vk_url text,
  telegram_url text,
  youtube_url text,
  instagram_url text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

insert into site_settings (id)
values (1)
on conflict (id) do nothing;

alter table site_settings
  add column if not exists company_name text;
alter table site_settings
  add column if not exists legal_address text;
alter table site_settings
  add column if not exists inn text;
alter table site_settings
  add column if not exists ogrn text;
alter table site_settings
  add column if not exists kpp text;
alter table site_settings
  add column if not exists policy_url text;
alter table site_settings
  add column if not exists vk_url text;
alter table site_settings
  add column if not exists telegram_url text;
alter table site_settings
  add column if not exists youtube_url text;
alter table site_settings
  add column if not exists instagram_url text;

create table if not exists site_pages (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  page_type text default 'custom',
  niche text,
  meta_description text,
  screenshot_avif_url text,
  screenshot_webp_url text,
  screenshot_jpg_url text,
  generation_status text default 'ready',
  generation_error text,
  generation_started_at timestamptz,
  generation_finished_at timestamptz,
  published boolean default true,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table site_pages
  add column if not exists screenshot_avif_url text;
alter table site_pages
  add column if not exists screenshot_webp_url text;
alter table site_pages
  add column if not exists screenshot_jpg_url text;
alter table site_pages
  add column if not exists generation_status text default 'ready';
alter table site_pages
  add column if not exists generation_error text;
alter table site_pages
  add column if not exists generation_started_at timestamptz;
alter table site_pages
  add column if not exists generation_finished_at timestamptz;

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
