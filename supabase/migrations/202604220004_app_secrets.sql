create table if not exists public.app_secrets (
  name text primary key,
  value text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.app_secrets enable row level security;

drop trigger if exists app_secrets_set_updated_at on public.app_secrets;
create trigger app_secrets_set_updated_at
before update on public.app_secrets
for each row execute function public.set_updated_at();

revoke all on table public.app_secrets from anon, authenticated;
grant select, insert, update, delete on table public.app_secrets to service_role;
