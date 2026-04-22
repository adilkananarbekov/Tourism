drop policy if exists "No public reads" on public.app_secrets;
create policy "No public reads"
on public.app_secrets
for select
to anon, authenticated
using (false);

drop policy if exists "No public inserts" on public.app_secrets;
create policy "No public inserts"
on public.app_secrets
for insert
to anon, authenticated
with check (false);

drop policy if exists "No public updates" on public.app_secrets;
create policy "No public updates"
on public.app_secrets
for update
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No public deletes" on public.app_secrets;
create policy "No public deletes"
on public.app_secrets
for delete
to anon, authenticated
using (false);
