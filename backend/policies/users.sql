-- Users-specific policy script
-- This file focuses only on users access.
-- For full policy coverage, use backend/supabase/rls-policies.sql.

alter table if exists public.users enable row level security;

drop policy if exists users_select_own on public.users;
create policy users_select_own on public.users
for select using (auth.uid() = id);

drop policy if exists users_update_own on public.users;
create policy users_update_own on public.users
for update using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists users_service_all on public.users;
create policy users_service_all on public.users
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');
