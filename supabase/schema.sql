-- FinSight account + security schema

create extension if not exists pgcrypto;

-- ─────────────────────────────────────────────────────────────────────────────
-- Enums
-- ─────────────────────────────────────────────────────────────────────────────

do $$
begin
	if not exists (select 1 from pg_type where typname = 'user_role') then
		create type public.user_role as enum ('user', 'admin');
	end if;
end
$$;

do $$
begin
	if not exists (select 1 from pg_type where typname = 'app_language') then
		create type public.app_language as enum ('en', 'ur');
	end if;
end
$$;

do $$
begin
	if not exists (select 1 from pg_type where typname = 'security_event_type') then
		create type public.security_event_type as enum (
			'signup',
			'login_success',
			'login_failed',
			'logout',
			'password_reset_requested',
			'password_changed',
			'email_verified',
			'profile_updated',
			'role_changed'
		);
	end if;
end
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Utility function
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
	new.updated_at = timezone('utc', now());
	return new;
end;
$$;

-- ─────────────────────────────────────────────────────────────────────────────
-- Core user profile table
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.profiles (
	id uuid primary key references auth.users(id) on delete cascade,
	email text not null,
	full_name text not null default '',
	avatar_url text,
	preferred_currency char(3) not null default 'PKR',
	language public.app_language not null default 'en',
	role public.user_role not null default 'user',
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now()),
	constraint profiles_email_format_chk check (position('@' in email) > 1),
	constraint profiles_currency_len_chk check (char_length(preferred_currency) = 3)
);

create unique index if not exists profiles_email_uidx on public.profiles (lower(email));
create index if not exists profiles_role_idx on public.profiles (role);
create index if not exists profiles_created_at_idx on public.profiles (created_at desc);

drop trigger if exists trg_profiles_set_updated_at on public.profiles;
create trigger trg_profiles_set_updated_at
before update on public.profiles
for each row
execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- User preferences (extensible for future personalization/AI)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_preferences (
	user_id uuid primary key references public.profiles(id) on delete cascade,
	timezone text not null default 'Asia/Karachi',
	week_start smallint not null default 1 check (week_start between 0 and 6),
	notifications_enabled boolean not null default true,
	email_notifications_enabled boolean not null default true,
	push_notifications_enabled boolean not null default false,
	ai_personalization_enabled boolean not null default false,
	metadata jsonb not null default '{}'::jsonb,
	created_at timestamptz not null default timezone('utc', now()),
	updated_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_preferences_ai_enabled_idx
	on public.user_preferences (ai_personalization_enabled);

drop trigger if exists trg_user_preferences_set_updated_at on public.user_preferences;
create trigger trg_user_preferences_set_updated_at
before update on public.user_preferences
for each row
execute function public.set_updated_at();

-- ─────────────────────────────────────────────────────────────────────────────
-- Extensible RBAC role assignments (future-proofing beyond admin/user)
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_role_assignments (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null references public.profiles(id) on delete cascade,
	role_key text not null,
	granted_by uuid references public.profiles(id) on delete set null,
	granted_at timestamptz not null default timezone('utc', now()),
	unique (user_id, role_key)
);

create index if not exists user_role_assignments_role_key_idx
	on public.user_role_assignments (role_key);

-- ─────────────────────────────────────────────────────────────────────────────
-- Security events audit log
-- ─────────────────────────────────────────────────────────────────────────────

create table if not exists public.user_security_events (
	id uuid primary key default gen_random_uuid(),
	user_id uuid references public.profiles(id) on delete cascade,
	event_type public.security_event_type not null,
	ip_address inet,
	user_agent text,
	event_metadata jsonb not null default '{}'::jsonb,
	occurred_at timestamptz not null default timezone('utc', now())
);

create index if not exists user_security_events_user_id_occurred_at_idx
	on public.user_security_events (user_id, occurred_at desc);

create index if not exists user_security_events_event_type_idx
	on public.user_security_events (event_type);

-- ─────────────────────────────────────────────────────────────────────────────
-- Sync profile records from Supabase Auth
-- ─────────────────────────────────────────────────────────────────────────────

create or replace function public.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
	new_full_name text;
begin
	new_full_name := coalesce(new.raw_user_meta_data->>'full_name', '');

	insert into public.profiles (id, email, full_name)
	values (new.id, coalesce(new.email, ''), new_full_name)
	on conflict (id) do update
		set email = excluded.email,
				full_name = case
					when public.profiles.full_name = '' then excluded.full_name
					else public.profiles.full_name
				end,
				updated_at = timezone('utc', now());

	insert into public.user_preferences (user_id)
	values (new.id)
	on conflict (user_id) do nothing;

	insert into public.user_security_events (user_id, event_type, event_metadata)
	values (new.id, 'signup', jsonb_build_object('source', 'auth.users trigger'));

	return new;
end;
$$;

drop trigger if exists trg_handle_new_auth_user on auth.users;
create trigger trg_handle_new_auth_user
after insert on auth.users
for each row
execute function public.handle_new_auth_user();

create or replace function public.handle_auth_user_email_update()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
	if new.email is distinct from old.email then
		update public.profiles
			set email = coalesce(new.email, email),
					updated_at = timezone('utc', now())
			where id = new.id;
	end if;

	return new;
end;
$$;

drop trigger if exists trg_handle_auth_user_email_update on auth.users;
create trigger trg_handle_auth_user_email_update
after update on auth.users
for each row
execute function public.handle_auth_user_email_update();

-- ─────────────────────────────────────────────────────────────────────────────
-- Row Level Security
-- ─────────────────────────────────────────────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.user_preferences enable row level security;
alter table public.user_role_assignments enable row level security;
alter table public.user_security_events enable row level security;

drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own on public.profiles
for select
using (auth.uid() = id);

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own on public.profiles
for update
using (auth.uid() = id)
with check (auth.uid() = id);

drop policy if exists user_preferences_select_own on public.user_preferences;
create policy user_preferences_select_own on public.user_preferences
for select
using (auth.uid() = user_id);

drop policy if exists user_preferences_update_own on public.user_preferences;
create policy user_preferences_update_own on public.user_preferences
for update
using (auth.uid() = user_id)
with check (auth.uid() = user_id);

drop policy if exists user_security_events_select_own on public.user_security_events;
create policy user_security_events_select_own on public.user_security_events
for select
using (auth.uid() = user_id);

drop policy if exists user_role_assignments_select_own on public.user_role_assignments;
create policy user_role_assignments_select_own on public.user_role_assignments
for select
using (auth.uid() = user_id);
