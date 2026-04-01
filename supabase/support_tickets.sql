-- Support tickets for Help Center and FAQ feedback flow
create table if not exists support_tickets (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  subject text not null,
  message text not null,
  ticket_type text not null check (ticket_type in ('message', 'review')),
  rating integer null check (rating between 1 and 5),
  status text not null default 'open' check (status in ('open', 'in_review', 'resolved', 'closed')),
  admin_response text null,
  admin_response_at timestamptz null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_support_tickets_user_created
  on support_tickets(user_id, created_at desc);

create index if not exists idx_support_tickets_status_created
  on support_tickets(status, created_at desc);

create trigger trg_support_tickets_updated_at
before update on support_tickets
for each row execute function update_updated_at_column();
