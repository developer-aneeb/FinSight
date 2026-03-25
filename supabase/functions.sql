-- FinSight SQL functions and triggers

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = now();
	return new;
end;
$$;

-- Keep users in sync with Supabase auth.users
create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	insert into public.users (id, email, full_name, role_id)
	values (
		new.id,
		coalesce(new.email, ''),
		coalesce(new.raw_user_meta_data->>'full_name', ''),
		1
	)
	on conflict (id) do update
		set email = excluded.email,
				full_name = case
					when public.users.full_name = '' then excluded.full_name
					else public.users.full_name
				end,
				updated_at = now();

	return new;
end;
$$;

create or replace function public.handle_auth_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.email is distinct from old.email then
		update public.users
			set email = coalesce(new.email, email),
					updated_at = now()
			where id = new.id;
	end if;

	return new;
end;
$$;

-- Denormalized monthly summary sync
create or replace function public.refresh_user_monthly_financials(p_user_id uuid, p_month_start date)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	v_income numeric(14,2);
	v_expense numeric(14,2);
	v_count integer;
begin
	select
		coalesce(sum(case when t.type = 'income' then t.amount else 0 end), 0),
		coalesce(sum(case when t.type = 'expense' then t.amount else 0 end), 0),
		count(*)::int
	into v_income, v_expense, v_count
	from public.transactions t
	where t.user_id = p_user_id
		and t.transaction_date >= p_month_start
		and t.transaction_date < (p_month_start + interval '1 month')::date;

	insert into public.user_monthly_financials (
		user_id,
		month_start,
		income_total,
		expense_total,
		net_balance,
		transaction_count,
		updated_at
	)
	values (
		p_user_id,
		p_month_start,
		v_income,
		v_expense,
		(v_income - v_expense),
		v_count,
		now()
	)
	on conflict (user_id, month_start) do update
		set income_total = excluded.income_total,
				expense_total = excluded.expense_total,
				net_balance = excluded.net_balance,
				transaction_count = excluded.transaction_count,
				updated_at = excluded.updated_at;
end;
$$;

-- Budget spent sync + threshold alerts
create or replace function public.refresh_budget_spent_and_alerts(p_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
	budget_row record;
	spent_total numeric(14,2);
	usage_ratio numeric(18,6);
begin
	for budget_row in
		select b.*
		from public.budgets b
		where b.user_id = p_user_id
	loop
		select coalesce(sum(t.amount), 0)
		into spent_total
		from public.transactions t
		where t.user_id = budget_row.user_id
			and t.type = 'expense'
			and (budget_row.category_id is null or t.category_id = budget_row.category_id)
			and t.transaction_date >= budget_row.start_date
			and (budget_row.end_date is null or t.transaction_date <= budget_row.end_date);

		update public.budgets
			set spent = spent_total,
					updated_at = now()
			where id = budget_row.id;

		if budget_row.amount_limit > 0 then
			usage_ratio := spent_total / budget_row.amount_limit;

			if usage_ratio >= 1 then
				if not exists (
					select 1
					from public.alerts a
					where a.user_id = budget_row.user_id
						and a.related_budget_id = budget_row.id
						and a.status = 'unread'
						and a.severity = 'critical'
				) then
					insert into public.alerts (user_id, title, message, severity, status, related_budget_id)
					values (
						budget_row.user_id,
						'Budget exceeded',
						format('%s budget exceeded by %s', budget_row.name, to_char(spent_total - budget_row.amount_limit, 'FM999999999.00')),
						'critical',
						'unread',
						budget_row.id
					);
				end if;
			elsif usage_ratio >= 0.8 then
				if not exists (
					select 1
					from public.alerts a
					where a.user_id = budget_row.user_id
						and a.related_budget_id = budget_row.id
						and a.status = 'unread'
						and a.severity = 'warning'
				) then
					insert into public.alerts (user_id, title, message, severity, status, related_budget_id)
					values (
						budget_row.user_id,
						'Budget warning',
						format('%s budget reached %s%%', budget_row.name, round(usage_ratio * 100)::int),
						'warning',
						'unread',
						budget_row.id
					);
				end if;
			end if;
		end if;
	end loop;
end;
$$;

-- Transaction change trigger: updates monthly summaries + budget spent
create or replace function public.handle_transaction_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	v_user_id uuid;
	v_new_month_start date;
	v_old_month_start date;
begin
	if tg_op = 'DELETE' then
		v_user_id := old.user_id;
		v_old_month_start := date_trunc('month', old.transaction_date)::date;
		perform public.refresh_user_monthly_financials(v_user_id, v_old_month_start);
		perform public.refresh_budget_spent_and_alerts(v_user_id);
		return old;
	end if;

	v_user_id := new.user_id;
	v_new_month_start := date_trunc('month', new.transaction_date)::date;
	perform public.refresh_user_monthly_financials(v_user_id, v_new_month_start);

	if tg_op = 'UPDATE' then
		v_old_month_start := date_trunc('month', old.transaction_date)::date;
		if v_old_month_start <> v_new_month_start then
			perform public.refresh_user_monthly_financials(v_user_id, v_old_month_start);
		end if;
	end if;

	perform public.refresh_budget_spent_and_alerts(v_user_id);
	return new;
end;
$$;

-- Trigger bindings
drop trigger if exists trg_users_set_updated_at on public.users;
create trigger trg_users_set_updated_at
before update on public.users
for each row execute function public.set_updated_at();

drop trigger if exists trg_categories_set_updated_at on public.categories;
create trigger trg_categories_set_updated_at
before update on public.categories
for each row execute function public.set_updated_at();

drop trigger if exists trg_tags_set_updated_at on public.tags;
create trigger trg_tags_set_updated_at
before update on public.tags
for each row execute function public.set_updated_at();

drop trigger if exists trg_transactions_set_updated_at on public.transactions;
create trigger trg_transactions_set_updated_at
before update on public.transactions
for each row execute function public.set_updated_at();

drop trigger if exists trg_budgets_set_updated_at on public.budgets;
create trigger trg_budgets_set_updated_at
before update on public.budgets
for each row execute function public.set_updated_at();

drop trigger if exists trg_handle_new_auth_user on auth.users;
create trigger trg_handle_new_auth_user
after insert on auth.users
for each row execute function public.handle_new_auth_user();

drop trigger if exists trg_handle_auth_user_email_update on auth.users;
create trigger trg_handle_auth_user_email_update
after update on auth.users
for each row execute function public.handle_auth_user_email_update();

drop trigger if exists trg_transactions_after_change on public.transactions;
create trigger trg_transactions_after_change
after insert or update or delete on public.transactions
for each row execute function public.handle_transaction_change();
