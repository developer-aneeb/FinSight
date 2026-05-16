-- FinSight row-level security policies

alter table if exists public.roles enable row level security;
alter table if exists public.users enable row level security;
alter table if exists public.categories enable row level security;
alter table if exists public.tags enable row level security;
alter table if exists public.transactions enable row level security;
alter table if exists public.transaction_tags enable row level security;
alter table if exists public.budgets enable row level security;
alter table if exists public.alerts enable row level security;
alter table if exists public.insights enable row level security;
alter table if exists public.user_monthly_financials enable row level security;
alter table if exists public.support_tickets enable row level security;

-- roles
drop policy if exists roles_read_authenticated on public.roles;
create policy roles_read_authenticated on public.roles
for select using (auth.role() = 'authenticated');

-- users
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

-- categories
drop policy if exists categories_select_own_or_system on public.categories;
create policy categories_select_own_or_system on public.categories
for select using (is_system = true or user_id = auth.uid());

drop policy if exists categories_insert_own on public.categories;
create policy categories_insert_own on public.categories
for insert with check (user_id = auth.uid() and is_system = false);

drop policy if exists categories_update_own on public.categories;
create policy categories_update_own on public.categories
for update using (user_id = auth.uid() and is_system = false)
with check (user_id = auth.uid() and is_system = false);

drop policy if exists categories_delete_own on public.categories;
create policy categories_delete_own on public.categories
for delete using (user_id = auth.uid() and is_system = false);

drop policy if exists categories_service_all on public.categories;
create policy categories_service_all on public.categories
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- tags
drop policy if exists tags_select_own on public.tags;
create policy tags_select_own on public.tags
for select using (user_id = auth.uid());

drop policy if exists tags_insert_own on public.tags;
create policy tags_insert_own on public.tags
for insert with check (user_id = auth.uid());

drop policy if exists tags_update_own on public.tags;
create policy tags_update_own on public.tags
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists tags_delete_own on public.tags;
create policy tags_delete_own on public.tags
for delete using (user_id = auth.uid());

drop policy if exists tags_service_all on public.tags;
create policy tags_service_all on public.tags
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- transactions
drop policy if exists transactions_select_own on public.transactions;
create policy transactions_select_own on public.transactions
for select using (user_id = auth.uid());

drop policy if exists transactions_insert_own on public.transactions;
create policy transactions_insert_own on public.transactions
for insert with check (user_id = auth.uid());

drop policy if exists transactions_update_own on public.transactions;
create policy transactions_update_own on public.transactions
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists transactions_delete_own on public.transactions;
create policy transactions_delete_own on public.transactions
for delete using (user_id = auth.uid());

drop policy if exists transactions_service_all on public.transactions;
create policy transactions_service_all on public.transactions
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- transaction_tags (ownership through transaction)
drop policy if exists transaction_tags_select_own on public.transaction_tags;
create policy transaction_tags_select_own on public.transaction_tags
for select using (
	exists (
		select 1
		from public.transactions t
		where t.id = transaction_tags.transaction_id
			and t.user_id = auth.uid()
	)
);

drop policy if exists transaction_tags_insert_own on public.transaction_tags;
create policy transaction_tags_insert_own on public.transaction_tags
for insert with check (
	exists (
		select 1
		from public.transactions t
		where t.id = transaction_tags.transaction_id
			and t.user_id = auth.uid()
	)
);

drop policy if exists transaction_tags_delete_own on public.transaction_tags;
create policy transaction_tags_delete_own on public.transaction_tags
for delete using (
	exists (
		select 1
		from public.transactions t
		where t.id = transaction_tags.transaction_id
			and t.user_id = auth.uid()
	)
);

drop policy if exists transaction_tags_service_all on public.transaction_tags;
create policy transaction_tags_service_all on public.transaction_tags
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- budgets
drop policy if exists budgets_select_own on public.budgets;
create policy budgets_select_own on public.budgets
for select using (user_id = auth.uid());

drop policy if exists budgets_insert_own on public.budgets;
create policy budgets_insert_own on public.budgets
for insert with check (user_id = auth.uid());

drop policy if exists budgets_update_own on public.budgets;
create policy budgets_update_own on public.budgets
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists budgets_delete_own on public.budgets;
create policy budgets_delete_own on public.budgets
for delete using (user_id = auth.uid());

drop policy if exists budgets_service_all on public.budgets;
create policy budgets_service_all on public.budgets
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- alerts
drop policy if exists alerts_select_own on public.alerts;
create policy alerts_select_own on public.alerts
for select using (user_id = auth.uid());

drop policy if exists alerts_update_own on public.alerts;
create policy alerts_update_own on public.alerts
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists alerts_insert_service_only on public.alerts;
create policy alerts_insert_service_only on public.alerts
for insert with check (auth.role() = 'service_role');

drop policy if exists alerts_delete_service_only on public.alerts;
create policy alerts_delete_service_only on public.alerts
for delete using (auth.role() = 'service_role');

-- insights
drop policy if exists insights_select_own on public.insights;
create policy insights_select_own on public.insights
for select using (user_id = auth.uid());

drop policy if exists insights_update_own on public.insights;
create policy insights_update_own on public.insights
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists insights_insert_service_only on public.insights;
create policy insights_insert_service_only on public.insights
for insert with check (auth.role() = 'service_role');

drop policy if exists insights_delete_service_only on public.insights;
create policy insights_delete_service_only on public.insights
for delete using (auth.role() = 'service_role');

-- denormalized monthly summaries
drop policy if exists user_monthly_financials_select_own on public.user_monthly_financials;
create policy user_monthly_financials_select_own on public.user_monthly_financials
for select using (user_id = auth.uid());

drop policy if exists user_monthly_financials_service_all on public.user_monthly_financials;
create policy user_monthly_financials_service_all on public.user_monthly_financials
for all using (auth.role() = 'service_role')
with check (auth.role() = 'service_role');

-- support_tickets
drop trigger if exists trg_support_tickets_updated_at on public.support_tickets;
create trigger trg_support_tickets_updated_at
before update on public.support_tickets
for each row execute function public.set_updated_at();

drop policy if exists support_tickets_select_own on public.support_tickets;
create policy support_tickets_select_own on public.support_tickets
for select using (user_id = auth.uid());

drop policy if exists support_tickets_insert_own on public.support_tickets;
create policy support_tickets_insert_own on public.support_tickets
for insert with check (user_id = auth.uid());

drop policy if exists support_tickets_update_own on public.support_tickets;
create policy support_tickets_update_own on public.support_tickets
for update using (user_id = auth.uid())
with check (user_id = auth.uid());

drop policy if exists support_tickets_delete_own on public.support_tickets;
create policy support_tickets_delete_own on public.support_tickets
for delete using (user_id = auth.uid());

drop policy if exists support_tickets_admin_all on public.support_tickets;
create policy support_tickets_admin_all on public.support_tickets
for all using (auth.role() = 'service_role' or exists (select 1 from public.users u where u.id = auth.uid() and u.role_id = 2))
with check (auth.role() = 'service_role' or exists (select 1 from public.users u where u.id = auth.uid() and u.role_id = 2));
