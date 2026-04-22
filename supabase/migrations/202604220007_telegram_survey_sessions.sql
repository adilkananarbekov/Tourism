create table if not exists public.telegram_survey_sessions (
  chat_id text primary key,
  telegram_user_id text,
  username text,
  first_name text,
  last_name text,
  current_step integer not null default 0,
  answers jsonb not null default '{}'::jsonb,
  completed boolean not null default false,
  started_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists telegram_survey_sessions_updated_at_idx
on public.telegram_survey_sessions (updated_at desc);

alter table public.telegram_survey_sessions enable row level security;

drop trigger if exists telegram_survey_sessions_set_updated_at on public.telegram_survey_sessions;
create trigger telegram_survey_sessions_set_updated_at
before update on public.telegram_survey_sessions
for each row execute function public.set_updated_at();

revoke all on table public.telegram_survey_sessions from anon, authenticated;
grant select, insert, update, delete on table public.telegram_survey_sessions to service_role;
