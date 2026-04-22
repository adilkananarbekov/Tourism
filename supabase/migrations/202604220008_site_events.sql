create table if not exists public.site_events (
  id uuid primary key default gen_random_uuid(),
  source text not null default 'web' check (source in ('web', 'telegram', 'system')),
  event_name text not null check (event_name ~ '^[a-z0-9_]{2,80}$'),
  path text not null default '',
  label text not null default '',
  metadata jsonb not null default '{}'::jsonb,
  user_agent text not null default '',
  referrer text not null default '',
  created_at timestamptz not null default now()
);

create index if not exists site_events_created_at_idx
on public.site_events (created_at desc);

create index if not exists site_events_event_name_idx
on public.site_events (event_name);

create index if not exists site_events_source_idx
on public.site_events (source);

alter table public.site_events enable row level security;

revoke all on table public.site_events from anon, authenticated;
grant select, insert on table public.site_events to service_role;
