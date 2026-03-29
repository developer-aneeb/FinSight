
-- execute SQL in this order: schema → functions → rls-policies → storage → seed, then I can run a quick API smoke test script
-- FinSight complete database schema
-- Goals:
-- 1) Normalized core model for maintainability and consistency
-- 2) Selective denormalization for fast dashboard analytics
-- 3) Compatibility with backend/frontend contracts used in this repository

create extension if not exists pgcrypto;
create extension if not exists pg_trgm;

set timezone = 'Asia/Karachi';



-- ─────────────────────────────────────────────────────────────────────────────
-- RBAC
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.roles (
  id serial primary key,
  name varchar(32) unique not null
);

insert into public.roles (id, name)
values
  (1, 'user'),
  (2, 'admin')
on conflict (id) do update set name = excluded.name;

-- ─────────────────────────────────────────────────────────────────────────────
-- Lookup tables for future extensibility
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.recurrence_intervals (
  code varchar(32) primary key,
  label text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.recurrence_intervals (code, label, sort_order)
values
  ('none', 'None', 0),
  ('daily', 'Daily', 1),
  ('weekly', 'Weekly', 2),
  ('monthly', 'Monthly', 3),
  ('yearly', 'Yearly', 4)
on conflict (code) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    is_active = true;

create table if not exists public.transaction_types (
  code varchar(32) primary key,
  label text not null,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.transaction_types (code, label)
values
  ('income', 'Income'),
  ('expense', 'Expense')
on conflict (code) do update
set label = excluded.label,
    is_active = true;

create table if not exists public.budget_periods (
  code varchar(32) primary key,
  label text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.budget_periods (code, label, sort_order)
values
  ('weekly', 'Weekly', 1),
  ('monthly', 'Monthly', 2),
  ('yearly', 'Yearly', 3)
on conflict (code) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    is_active = true;

create table if not exists public.alert_severities (
  code varchar(32) primary key,
  label text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.alert_severities (code, label, sort_order)
values
  ('info', 'Info', 1),
  ('warning', 'Warning', 2),
  ('critical', 'Critical', 3)
on conflict (code) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    is_active = true;

create table if not exists public.alert_statuses (
  code varchar(32) primary key,
  label text not null,
  sort_order smallint not null default 0,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into public.alert_statuses (code, label, sort_order)
values
  ('unread', 'Unread', 1),
  ('read', 'Read', 2),
  ('dismissed', 'Dismissed', 3)
on conflict (code) do update
set label = excluded.label,
    sort_order = excluded.sort_order,
    is_active = true;



-- ─────────────────────────────────────────────────────────────────────────────
-- Users (extends auth.users)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  phone text,
  role_id smallint not null default 1 references public.roles(id),
  address jsonb not null default '{}'::jsonb text,
  preferred_currency char(3) not null default 'PKR',
  is_active boolean not null default true,
  last_login_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint users_currency_len_chk check (char_length(preferred_currency) = 3)
);

create index if not exists users_role_id_idx on public.users(role_id);
create index if not exists users_created_at_idx on public.users(created_at desc);
create index if not exists users_is_active_idx on public.users(is_active);
create unique index if not exists users_email_lower_uidx on public.users(lower(email));


-- ─────────────────────────────────────────────────────────────────────────────
-- Categories & Tags (normalized classification)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.users(id) on delete cascade,
  name text not null,
  icon varchar(10) not null default '📁',
  color varchar(20) not null default '#6B7280',
  parent_id uuid references public.categories(id) on delete set null,
  is_system boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint categories_name_not_blank_chk check (length(trim(name)) > 0),
  constraint categories_system_owner_chk check ((is_system and user_id is null) or (not is_system and user_id is not null))
);

create unique index if not exists categories_system_name_uidx
  on public.categories (lower(name))
  where is_system = true;

create unique index if not exists categories_user_name_uidx
  on public.categories (user_id, lower(name))
  where is_system = false;

create index if not exists categories_user_id_idx on public.categories(user_id);
create index if not exists categories_parent_id_idx on public.categories(parent_id);


create table if not exists public.tags (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  name text not null,
  color varchar(20) not null default '#3B82F6',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint tags_name_not_blank_chk check (length(trim(name)) > 0)
);

create unique index if not exists tags_user_name_uidx on public.tags (user_id, lower(name));
create index if not exists tags_user_id_idx on public.tags(user_id);



-- ─────────────────────────────────────────────────────────────────────────────
-- Transactions (normalized facts)
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.transactions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type varchar(32) not null references public.transaction_types(code),
  amount numeric(14,2) not null check (amount > 0),
  currency char(3) not null default 'PKR',
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  notes text not null default '',
  transaction_date date not null default current_date,
  is_recurring boolean not null default false,
  recurrence varchar(32) not null default 'none' references public.recurrence_intervals(code),
  next_recurrence date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint transactions_currency_len_chk check (char_length(currency) = 3),
  constraint transactions_recurrence_consistency_chk check (
    (is_recurring = false and recurrence = 'none')
    or
    (is_recurring = true and recurrence <> 'none')
  )
);

create index if not exists transactions_user_date_idx on public.transactions(user_id, transaction_date desc);
create index if not exists transactions_user_type_idx on public.transactions(user_id, type);
create index if not exists transactions_user_category_idx on public.transactions(user_id, category_id);
create index if not exists transactions_desc_trgm_idx on public.transactions using gin (description gin_trgm_ops);

create table if not exists public.transaction_tags (
  transaction_id uuid not null references public.transactions(id) on delete cascade,
  tag_id uuid not null references public.tags(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (transaction_id, tag_id)
);

create index if not exists transaction_tags_tag_id_idx on public.transaction_tags(tag_id);



-- ─────────────────────────────────────────────────────────────────────────────
-- Budgets, Alerts, Insights
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.budgets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  category_id uuid references public.categories(id) on delete set null,
  name text not null,
  amount_limit numeric(14,2) not null check (amount_limit > 0),
  spent numeric(14,2) not null default 0 check (spent >= 0),
  period varchar(32) not null default 'monthly' references public.budget_periods(code),
  start_date date not null default current_date,
  end_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint budgets_name_not_blank_chk check (length(trim(name)) > 0),
  constraint budgets_date_range_chk check (end_date is null or end_date >= start_date)
);

create index if not exists budgets_user_active_idx on public.budgets(user_id, is_active);
create index if not exists budgets_user_category_idx on public.budgets(user_id, category_id);
create index if not exists budgets_date_range_idx on public.budgets(user_id, start_date, end_date);

create table if not exists public.alerts (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  message text not null,
  severity varchar(32) not null default 'info' references public.alert_severities(code),
  status varchar(32) not null default 'unread' references public.alert_statuses(code),
  related_budget_id uuid references public.budgets(id) on delete set null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index if not exists alerts_user_created_idx on public.alerts(user_id, created_at desc);
create index if not exists alerts_user_status_idx on public.alerts(user_id, status);

create table if not exists public.insights (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  title text not null,
  body text not null,
  insight_type text not null default 'summary',
  metadata jsonb not null default '{}'::jsonb,
  is_dismissed boolean not null default false,
  generated_at timestamptz not null default now(),
  dismissed_at timestamptz
);

create index if not exists insights_user_generated_idx on public.insights(user_id, generated_at desc);
create index if not exists insights_user_dismissed_idx on public.insights(user_id, is_dismissed);



-- ─────────────────────────────────────────────────────────────────────────────
-- Denormalized analytics table (fast dashboard reads)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_monthly_financials (
  user_id uuid not null references public.users(id) on delete cascade,
  month_start date not null,
  income_total numeric(14,2) not null default 0,
  expense_total numeric(14,2) not null default 0,
  net_balance numeric(14,2) not null default 0,
  transaction_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, month_start),
  constraint user_monthly_financials_month_start_chk check (date_trunc('month', month_start)::date = month_start)
);

create index if not exists user_monthly_financials_user_idx on public.user_monthly_financials(user_id, month_start desc);


-- Recurring transaction rules normalized from transaction facts
-- Recurring transaction rules normalized from transaction facts
create table if not exists public.recurring_transaction_rules (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references public.users(id) on delete cascade,
  type varchar(32) not null references public.transaction_types(code),
  amount numeric(14,2) not null check (amount > 0),
  currency char(3) not null default 'PKR',
  category_id uuid references public.categories(id) on delete set null,
  description text not null default '',
  notes text not null default '',
  recurrence varchar(32) not null references public.recurrence_intervals(code),
  start_date date not null,
  end_date date,
  next_run_date date,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint recurring_transaction_rules_recurrence_chk check (recurrence <> 'none'),
  constraint recurring_transaction_rules_date_range_chk check (end_date is null or end_date >= start_date),
  constraint recurring_transaction_rules_currency_len_chk check (char_length(currency) = 3)
);

create index if not exists recurring_rules_user_idx on public.recurring_transaction_rules(user_id, is_active);
create index if not exists recurring_rules_next_run_idx on public.recurring_transaction_rules(next_run_date);

-- Denormalized daily table for very fast charting/filtering
create table if not exists public.user_daily_financials (
  user_id uuid not null references public.users(id) on delete cascade,
  day_date date not null,
  income_total numeric(14,2) not null default 0,
  expense_total numeric(14,2) not null default 0,
  net_balance numeric(14,2) not null default 0,
  transaction_count integer not null default 0,
  updated_at timestamptz not null default now(),
  primary key (user_id, day_date)
);

create index if not exists user_daily_financials_user_idx on public.user_daily_financials(user_id, day_date desc);
