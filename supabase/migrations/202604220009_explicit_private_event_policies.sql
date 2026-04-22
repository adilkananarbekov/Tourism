drop policy if exists "No public access to site events" on public.site_events;
create policy "No public access to site events"
on public.site_events
for all
to anon, authenticated
using (false)
with check (false);

drop policy if exists "No public access to telegram survey sessions" on public.telegram_survey_sessions;
create policy "No public access to telegram survey sessions"
on public.telegram_survey_sessions
for all
to anon, authenticated
using (false)
with check (false);
