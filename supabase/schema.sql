-- ============================================================
-- סלון תור — Supabase Schema
-- הרץ קובץ זה ב-SQL Editor של Supabase
-- ============================================================

-- Settings (single row)
create table if not exists settings (
  id uuid primary key default gen_random_uuid(),
  salon_name text default '',
  work_days integer[] default array[0,1,2,3,4],
  open_mins integer default 540,
  close_mins integer default 1200,
  default_duration integer default 60,
  day_hours jsonb default '{}',
  pin text default null,
  updated_at timestamptz default now()
);

-- Insert default row if empty
insert into settings (salon_name)
select '' where not exists (select 1 from settings);

-- Providers (מטפלים)
create table if not exists providers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  color text not null default '1',
  sort_order integer default 0,
  created_at timestamptz default now()
);

-- Insert defaults
insert into providers (name, color, sort_order)
select * from (values ('דנה','1',0),('מיכל','2',1),('יעל','3',2)) as v(name,color,sort_order)
where not exists (select 1 from providers);

-- Clients (לקוחות)
create table if not exists clients (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text default '',
  note text default '',
  created_at timestamptz default now()
);

-- Appointments (תורים)
create table if not exists appointments (
  id uuid primary key default gen_random_uuid(),
  client_name text not null,
  client_id uuid references clients(id) on delete set null,
  phone text default '',
  service text default '',
  date date not null,
  time time not null,
  duration integer not null default 60,
  provider_id uuid references providers(id) on delete cascade,
  note text default '',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- Vacations (חופשות)
create table if not exists vacations (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id) on delete cascade,
  from_date date not null,
  to_date date not null,
  note text default '',
  created_at timestamptz default now()
);

-- ============================================================
-- INDEXES
-- ============================================================
create index if not exists appts_date_idx on appointments(date);
create index if not exists appts_provider_idx on appointments(provider_id);
create index if not exists vac_provider_idx on vacations(provider_id);
create index if not exists clients_name_idx on clients(name);

-- ============================================================
-- ROW LEVEL SECURITY
-- כרגע פתוח לכל (PIN מנוהל ב-client)
-- בעתיד: הוסף auth.uid() checks
-- ============================================================
alter table settings enable row level security;
alter table providers enable row level security;
alter table appointments enable row level security;
alter table clients enable row level security;
alter table vacations enable row level security;

create policy "allow all" on settings for all using (true) with check (true);
create policy "allow all" on providers for all using (true) with check (true);
create policy "allow all" on appointments for all using (true) with check (true);
create policy "allow all" on clients for all using (true) with check (true);
create policy "allow all" on vacations for all using (true) with check (true);

-- ============================================================
-- REALTIME — enable for live sync between devices
-- ============================================================
alter publication supabase_realtime add table appointments;
alter publication supabase_realtime add table providers;
alter publication supabase_realtime add table settings;
alter publication supabase_realtime add table vacations;
alter publication supabase_realtime add table clients;

-- ============================================================
-- MIGRATION — run on existing databases
-- ============================================================
alter table settings add column if not exists pin text default null;
alter table settings add column if not exists services text[] default '{}';
