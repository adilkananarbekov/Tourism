create extension if not exists pgcrypto;

create table if not exists public.tours (
  id integer primary key,
  title text not null,
  duration text not null default '',
  tour_type text not null default '',
  season text not null default '',
  description text not null default '',
  image text not null default '',
  price text not null default '',
  locations jsonb not null default '[]'::jsonb,
  highlights jsonb not null default '[]'::jsonb,
  itinerary jsonb not null default '[]'::jsonb,
  packing_list jsonb not null default '[]'::jsonb,
  practical_info jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.bookings (
  id uuid primary key default gen_random_uuid(),
  tour_id integer references public.tours(id) on delete set null,
  tour_title text not null,
  name text not null,
  email text not null,
  phone text not null default '',
  participants integer not null default 1 check (participants > 0),
  start_date date not null,
  end_date date not null,
  notes text not null default '',
  price_per_person text not null default '',
  total_price text not null default '',
  user_id text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.custom_tour_requests (
  id uuid primary key default gen_random_uuid(),
  group_size integer not null default 1 check (group_size > 0),
  start_date date not null,
  end_date date not null,
  start_location text not null,
  end_location text not null,
  sights jsonb not null default '[]'::jsonb,
  activities jsonb not null default '[]'::jsonb,
  pace text not null default 'moderate',
  accommodation text not null default 'mix',
  name text not null,
  email text not null,
  phone text not null,
  budget text not null default '',
  special_requests text not null default '',
  user_id text,
  status text not null default 'pending' check (status in ('pending', 'approved', 'rejected', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists bookings_created_at_idx on public.bookings (created_at desc);
create index if not exists bookings_email_idx on public.bookings (lower(email));
create index if not exists bookings_status_idx on public.bookings (status);
create index if not exists custom_tour_requests_created_at_idx on public.custom_tour_requests (created_at desc);
create index if not exists custom_tour_requests_email_idx on public.custom_tour_requests (lower(email));
create index if not exists custom_tour_requests_status_idx on public.custom_tour_requests (status);

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists tours_set_updated_at on public.tours;
create trigger tours_set_updated_at
before update on public.tours
for each row execute function public.set_updated_at();

drop trigger if exists bookings_set_updated_at on public.bookings;
create trigger bookings_set_updated_at
before update on public.bookings
for each row execute function public.set_updated_at();

drop trigger if exists custom_tour_requests_set_updated_at on public.custom_tour_requests;
create trigger custom_tour_requests_set_updated_at
before update on public.custom_tour_requests
for each row execute function public.set_updated_at();

alter table public.tours enable row level security;
alter table public.bookings enable row level security;
alter table public.custom_tour_requests enable row level security;

drop policy if exists "Public can read active tours" on public.tours;
create policy "Public can read active tours"
on public.tours
for select
to anon, authenticated
using (is_active = true);

drop policy if exists "Guests can create booking requests" on public.bookings;
create policy "Guests can create booking requests"
on public.bookings
for insert
to anon, authenticated
with check (
  status = 'pending'
  and length(trim(name)) > 0
  and length(trim(email)) > 0
  and participants > 0
);

drop policy if exists "Guests can create custom tour requests" on public.custom_tour_requests;
create policy "Guests can create custom tour requests"
on public.custom_tour_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and length(trim(name)) > 0
  and length(trim(email)) > 0
  and length(trim(phone)) > 0
  and group_size > 0
);
