-- HRG staff site: full database schema.
-- Run once in Supabase: SQL Editor -> New query -> paste -> Run.

create extension if not exists "pgcrypto";

-- Staff profiles (one per login)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null default '',
  role text not null default 'staff', -- 'admin' | 'staff'
  job_title text default '',
  created_at timestamptz default now()
);

create table if not exists players (
  id uuid primary key default gen_random_uuid(),
  full_name text not null,
  shirt_number int,
  position text,
  birth_date date,
  nationality text,
  phone text,
  email text,
  height_cm int,
  weight_kg numeric,
  foot text,
  contract_until date,
  agent text,
  notes text,
  photo_url text,
  active boolean default true,
  created_at timestamptz default now()
);

create table if not exists matches (
  id uuid primary key default gen_random_uuid(),
  round text,
  opponent text not null,
  match_date date,
  home boolean default true,
  competition text default 'ליגת העל',
  goals_for int,
  goals_against int,
  notes text,
  created_at timestamptz default now()
);

create table if not exists match_files (
  id uuid primary key default gen_random_uuid(),
  match_id uuid references matches(id) on delete cascade,
  category text not null, -- pre | post | animations | full | reports | individual | other
  title text not null,
  storage_path text,       -- file in the 'files' bucket
  external_url text,       -- or a link (Drive, Wyscout, YouTube...)
  player_id uuid references players(id) on delete set null,
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  kind text default 'training', -- training | match | meeting | travel | gym | other
  starts_at timestamptz not null,
  ends_at timestamptz,
  location text,
  notes text,
  match_id uuid references matches(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  assignee_id uuid references profiles(id) on delete set null,
  due_date date,
  status text default 'todo', -- todo | doing | done
  priority text default 'normal', -- low | normal | high
  match_id uuid references matches(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists wellness (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  entry_date date not null default current_date,
  sleep_hours numeric,
  sleep_quality int,  -- 1 (bad) .. 5 (great)
  fatigue int,        -- 1 (very tired) .. 5 (fresh)
  soreness int,       -- 1 (very sore) .. 5 (no soreness)
  stress int,         -- 1 (very stressed) .. 5 (relaxed)
  mood int,           -- 1 .. 5
  notes text,
  created_at timestamptz default now()
);

create table if not exists rpe (
  id uuid primary key default gen_random_uuid(),
  player_id uuid references players(id) on delete cascade,
  entry_date date not null default current_date,
  session_type text default 'training', -- training | match | gym | other
  rpe int not null,       -- 1..10
  duration_min int not null,
  load int generated always as (rpe * duration_min) stored,
  notes text,
  created_at timestamptz default now()
);

-- Generic data imports (GPS K-Sport, Opta, TruMedia, Wyscout exports)
create table if not exists data_imports (
  id uuid primary key default gen_random_uuid(),
  source text not null, -- gps | opta | trumedia | wyscout | other
  title text not null,
  data_date date,
  match_id uuid references matches(id) on delete set null,
  columns text[] not null default '{}',
  rows jsonb not null default '[]',
  uploaded_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists scouting_lists (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  description text,
  created_at timestamptz default now()
);

create table if not exists scouting_players (
  id uuid primary key default gen_random_uuid(),
  list_id uuid references scouting_lists(id) on delete set null,
  full_name text not null,
  club text,
  position text,
  birth_year int,
  nationality text,
  foot text,
  agent text,
  status text default 'watching', -- watching | priority | contacted | rejected | signed
  rating int,  -- 1..10
  video_url text,
  notes text,
  created_at timestamptz default now()
);

create table if not exists scouting_reports (
  id uuid primary key default gen_random_uuid(),
  scouting_player_id uuid references scouting_players(id) on delete cascade,
  author_id uuid references profiles(id) on delete set null,
  match_watched text,
  report_date date default current_date,
  rating int,
  body text,
  storage_path text,
  created_at timestamptz default now()
);

create table if not exists lineups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  formation text default '4-3-3',
  slots jsonb not null default '[]', -- [{x,y,label,player_id}]
  bench uuid[] default '{}',
  match_id uuid references matches(id) on delete set null,
  created_by uuid references profiles(id) on delete set null,
  created_at timestamptz default now()
);

-- Added after v1 (safe to re-run)
alter table players add column if not exists availability text default 'available'; -- available | doubtful | injured
alter table players add column if not exists injury_note text;

-- Row level security: any logged-in staff member can read and write everything.
do $$
declare t text;
begin
  foreach t in array array['profiles','players','matches','match_files','events','tasks','wellness','rpe','data_imports','scouting_lists','scouting_players','scouting_reports','lineups']
  loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists staff_all on %I', t);
    execute format('create policy staff_all on %I for all to authenticated using (true) with check (true)', t);
  end loop;
end $$;

-- File storage bucket (private; staff only)
insert into storage.buckets (id, name, public) values ('files', 'files', false)
on conflict (id) do nothing;

drop policy if exists staff_files on storage.objects;
create policy staff_files on storage.objects for all to authenticated
  using (bucket_id = 'files') with check (bucket_id = 'files');
