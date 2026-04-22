alter table public.bookings
  alter column email drop not null,
  alter column email set default '',
  alter column start_date drop not null,
  alter column end_date drop not null,
  add column if not exists telegram_username text not null default '',
  add column if not exists contact_preference text not null default 'telegram_or_phone',
  add column if not exists date_flexibility text not null default '';

alter table public.custom_tour_requests
  alter column email drop not null,
  alter column email set default '',
  alter column phone set default '',
  alter column start_date drop not null,
  alter column end_date drop not null,
  add column if not exists telegram_username text not null default '',
  add column if not exists contact_preference text not null default 'telegram_or_phone',
  add column if not exists date_flexibility text not null default '';

drop policy if exists "Guests can create booking requests" on public.bookings;
create policy "Guests can create booking requests"
on public.bookings
for insert
to anon, authenticated
with check (
  status = 'pending'
  and length(trim(name)) > 0
  and participants > 0
  and (
    length(trim(coalesce(phone, ''))) > 0
    or length(trim(coalesce(telegram_username, ''))) > 0
  )
);

drop policy if exists "Guests can create custom tour requests" on public.custom_tour_requests;
create policy "Guests can create custom tour requests"
on public.custom_tour_requests
for insert
to anon, authenticated
with check (
  status = 'pending'
  and length(trim(name)) > 0
  and group_size > 0
  and (
    length(trim(coalesce(phone, ''))) > 0
    or length(trim(coalesce(telegram_username, ''))) > 0
  )
);
