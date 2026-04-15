-- Enable UUID generation helper.
create extension if not exists pgcrypto;

-- Application users.
create table if not exists users (
  id uuid primary key default gen_random_uuid(),
  email text unique,
  display_name text not null,
  password_hash text,
  role text not null default 'student' check (role in ('student', 'teacher', 'parent')),
  grade text,
  target_score integer check (target_score between 0 and 100),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table users
add column if not exists password_hash text;

create index if not exists idx_users_role on users(role);
create index if not exists idx_users_created_at on users(created_at desc);

-- Generated papers and submitted practice records.
create table if not exists practice_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references users(id) on delete set null,

  grade text,
  board text not null,
  subject text not null,
  paper text not null,

  difficulty text,
  topics text[] not null default '{}',
  requested_count integer not null default 8 check (requested_count between 1 and 100),
  fallback_applied boolean not null default false,

  generated_questions jsonb not null,
  answers integer[],
  result jsonb,
  wrong_log jsonb,

  status text not null default 'generated' check (status in ('generated', 'submitted')),
  created_at timestamptz not null default now(),
  submitted_at timestamptz
);

create index if not exists idx_practice_user_created on practice_sessions(user_id, created_at desc);
create index if not exists idx_practice_status on practice_sessions(status);
create index if not exists idx_practice_board_subject_paper on practice_sessions(board, subject, paper);
create index if not exists idx_practice_topics_gin on practice_sessions using gin(topics);

-- Convenience analytics view for per-user practice summary.
create or replace view user_practice_summary as
select
  user_id,
  count(*) as total_sessions,
  count(*) filter (where status = 'submitted') as submitted_sessions,
  round(avg((result ->> 'accuracy')::numeric), 2) as avg_accuracy,
  max(submitted_at) as last_submitted_at
from practice_sessions
group by user_id;
