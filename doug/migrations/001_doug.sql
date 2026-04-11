create table if not exists doug_threads (
  id uuid primary key default gen_random_uuid(),
  title text not null default 'New thread',
  source text not null default 'telegram',
  created_at timestamptz default now(),
  updated_at timestamptz default now(),
  message_count int default 0,
  model_used text default 'claude-haiku-4-5',
  cost_usd numeric(10,6) default 0
);

create table if not exists doug_messages (
  id uuid primary key default gen_random_uuid(),
  thread_id uuid references doug_threads(id) on delete cascade,
  role text not null,
  content text not null,
  created_at timestamptz default now(),
  tokens_used int default 0,
  cost_usd numeric(10,6) default 0
);

create table if not exists doug_memory_files (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  content text not null,
  updated_at timestamptz default now()
);
