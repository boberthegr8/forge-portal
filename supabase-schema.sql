-- ── PROJECTS ──────────────────────────────────────────────────
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  token text unique not null default substr(md5(random()::text), 1, 16),
  client_name text not null,
  client_email text,
  project_name text not null,
  project_desc text,
  rep_name text not null default 'Rob Flagg',
  rep_company text not null default 'Forge Building Group',
  status text not null default 'active',
  portal_enabled boolean not null default true,
  active_quote_id uuid,
  created_at timestamptz default now()
);

-- ── MESSAGES ──────────────────────────────────────────────────
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  sender text not null check (sender in ('rep', 'client')),
  type text not null check (type in ('text', 'file', 'photo', 'quote', 'status_update')),
  text text,
  file_name text,
  file_size text,
  file_type text,
  quote_id uuid,
  read boolean not null default false,
  created_at timestamptz default now()
);

-- ── QUOTES ────────────────────────────────────────────────────
create table if not exists quotes (
  id uuid primary key default gen_random_uuid(),
  project_id uuid references projects(id) on delete cascade not null,
  number text not null,
  line_items jsonb not null default '[]',
  total numeric not null default 0,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected')),
  notes text,
  approved_at timestamptz,
  created_at timestamptz default now()
);

-- ── RLS POLICIES ──────────────────────────────────────────────
alter table projects enable row level security;
alter table messages enable row level security;
alter table quotes enable row level security;

-- Allow all reads/writes via anon key (we control access in app)
create policy "Allow all" on projects for all using (true) with check (true);
create policy "Allow all" on messages for all using (true) with check (true);
create policy "Allow all" on quotes for all using (true) with check (true);

-- ── REALTIME ──────────────────────────────────────────────────
alter publication supabase_realtime add table messages;
alter publication supabase_realtime add table quotes;
alter publication supabase_realtime add table projects;
