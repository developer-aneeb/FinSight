-- ============================================================
-- FinSight — Seed Data (Mock Data for Development)
-- ============================================================

-- Note: These inserts assume you've already signed up test users
-- through Supabase Auth. Replace the UUIDs below with actual
-- auth.users IDs from your project.

-- ─── System Categories ──────────────────────────────────────
INSERT INTO public.categories (id, user_id, name, icon, color, is_system) VALUES
  ('a0000000-0000-0000-0000-000000000001', NULL, 'Food & Dining',       '🍔', '#EF4444', true),
  ('a0000000-0000-0000-0000-000000000002', NULL, 'Transportation',      '🚗', '#F59E0B', true),
  ('a0000000-0000-0000-0000-000000000003', NULL, 'Shopping',            '🛍️', '#8B5CF6', true),
  ('a0000000-0000-0000-0000-000000000004', NULL, 'Bills & Utilities',   '💡', '#06B6D4', true),
  ('a0000000-0000-0000-0000-000000000005', NULL, 'Entertainment',       '🎬', '#EC4899', true),
  ('a0000000-0000-0000-0000-000000000006', NULL, 'Healthcare',          '🏥', '#10B981', true),
  ('a0000000-0000-0000-0000-000000000007', NULL, 'Education',           '📚', '#3B82F6', true),
  ('a0000000-0000-0000-0000-000000000008', NULL, 'Salary',              '💰', '#22C55E', true),
  ('a0000000-0000-0000-0000-000000000009', NULL, 'Freelance',           '💻', '#14B8A6', true),
  ('a0000000-0000-0000-0000-000000000010', NULL, 'Investments',         '📈', '#6366F1', true),
  ('a0000000-0000-0000-0000-000000000011', NULL, 'Groceries',           '🛒', '#84CC16', true),
  ('a0000000-0000-0000-0000-000000000012', NULL, 'Rent',                '🏠', '#F97316', true),
  ('a0000000-0000-0000-0000-000000000013', NULL, 'Subscriptions',       '📱', '#A855F7', true),
  ('a0000000-0000-0000-0000-000000000014', NULL, 'Savings',             '🏦', '#0EA5E9', true),
  ('a0000000-0000-0000-0000-000000000015', NULL, 'Other Income',        '💵', '#4ADE80', true),
  ('a0000000-0000-0000-0000-000000000016', NULL, 'Other Expense',       '📋', '#9CA3AF', true);

-- ─── Sample User Profile ────────────────────────────────────
-- (Auto-created via trigger, but adding explicit test user)
-- Replace 'TEST_USER_ID' with an actual UUID from auth.users
-- INSERT INTO public.profiles (id, email, full_name, preferred_currency, role)
-- VALUES ('TEST_USER_ID', 'test@finsight.pk', 'Ali Ahmed', 'PKR', 'user');

-- ─── Sample Transactions (use after user signup) ────────────
-- Uncomment and replace USER_ID with actual profile id:
/*
INSERT INTO public.transactions (user_id, type, amount, category_id, description, transaction_date) VALUES
  ('USER_ID', 'income',  150000.00, 'a0000000-0000-0000-0000-000000000008', 'Monthly Salary - March',          '2026-03-01'),
  ('USER_ID', 'income',   25000.00, 'a0000000-0000-0000-0000-000000000009', 'Freelance Web Project',           '2026-03-05'),
  ('USER_ID', 'expense',  35000.00, 'a0000000-0000-0000-0000-000000000012', 'Monthly Rent',                     '2026-03-01'),
  ('USER_ID', 'expense',  12000.00, 'a0000000-0000-0000-0000-000000000011', 'Weekly Groceries',                 '2026-03-02'),
  ('USER_ID', 'expense',   4500.00, 'a0000000-0000-0000-0000-000000000001', 'Dinner at Monal',                  '2026-03-03'),
  ('USER_ID', 'expense',   2500.00, 'a0000000-0000-0000-0000-000000000002', 'Uber rides this week',             '2026-03-04'),
  ('USER_ID', 'expense',   1500.00, 'a0000000-0000-0000-0000-000000000013', 'Netflix + Spotify',                '2026-03-01'),
  ('USER_ID', 'expense',   8000.00, 'a0000000-0000-0000-0000-000000000004', 'Electricity bill - Feb',           '2026-03-06'),
  ('USER_ID', 'expense',   3000.00, 'a0000000-0000-0000-0000-000000000005', 'Cinema + snacks',                  '2026-03-07'),
  ('USER_ID', 'expense',  15000.00, 'a0000000-0000-0000-0000-000000000007', 'Online course - React Advanced',   '2026-03-08'),
  ('USER_ID', 'expense',   5500.00, 'a0000000-0000-0000-0000-000000000001', 'Weekly eating out',                '2026-03-10'),
  ('USER_ID', 'expense',   2000.00, 'a0000000-0000-0000-0000-000000000006', 'Pharmacy',                         '2026-03-09'),
  ('USER_ID', 'income',   10000.00, 'a0000000-0000-0000-0000-000000000015', 'Sold old laptop',                  '2026-03-12'),
  ('USER_ID', 'expense',   7000.00, 'a0000000-0000-0000-0000-000000000003', 'New headphones',                   '2026-03-14'),
  ('USER_ID', 'expense',  20000.00, 'a0000000-0000-0000-0000-000000000014', 'Monthly savings transfer',         '2026-03-15');

-- ─── Sample Budgets ─────────────────────────────────────────
INSERT INTO public.budgets (user_id, category_id, name, amount_limit, period, start_date) VALUES
  ('USER_ID', 'a0000000-0000-0000-0000-000000000001', 'Food Budget',           15000.00, 'monthly', '2026-03-01'),
  ('USER_ID', 'a0000000-0000-0000-0000-000000000002', 'Transport Budget',       5000.00, 'monthly', '2026-03-01'),
  ('USER_ID', 'a0000000-0000-0000-0000-000000000005', 'Entertainment Budget',   5000.00, 'monthly', '2026-03-01'),
  ('USER_ID', 'a0000000-0000-0000-0000-000000000003', 'Shopping Budget',       10000.00, 'monthly', '2026-03-01'),
  ('USER_ID', 'a0000000-0000-0000-0000-000000000011', 'Groceries Budget',      15000.00, 'monthly', '2026-03-01');

-- ─── Sample Alerts ──────────────────────────────────────────
INSERT INTO public.alerts (user_id, title, message, severity) VALUES
  ('USER_ID', 'Food budget at 67%',          'You''ve spent PKR 10,000 of your PKR 15,000 food budget this month.', 'warning'),
  ('USER_ID', 'Welcome to FinSight!',        'Start by adding your first transaction to track your spending.',     'info'),
  ('USER_ID', 'Entertainment limit reached',  'You''ve reached your PKR 5,000 entertainment budget for March.',    'critical');

-- ─── Sample Insights ────────────────────────────────────────
INSERT INTO public.insights (user_id, title, body, insight_type, metadata) VALUES
  ('USER_ID', 'Dining spending spike',      'Your dining out expenses increased by 35% compared to last month. Consider cooking at home more often.', 'spending_pattern', '{"category": "Food & Dining", "change_pct": 35}'),
  ('USER_ID', 'Subscription savings tip',   'You could save PKR 1,500/month by reviewing your active subscriptions.', 'saving_opportunity', '{"potential_savings": 1500}'),
  ('USER_ID', 'Savings rate improving',     'Your savings rate improved from 10% to 14% this month. Keep it up!', 'positive_trend', '{"previous_rate": 10, "current_rate": 14}');
*/
