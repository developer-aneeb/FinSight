-- FinSight seed data
-- Run after schema.sql + functions.sql

-- System categories (global)
insert into public.categories (id, user_id, name, icon, color, is_system)
values
	(gen_random_uuid(), null, 'Salary', '💼', '#10B981', true),
	(gen_random_uuid(), null, 'Freelance', '🧾', '#059669', true),
	(gen_random_uuid(), null, 'Investments', '📈', '#0EA5E9', true),
	(gen_random_uuid(), null, 'Other Income', '💰', '#22C55E', true),
	(gen_random_uuid(), null, 'Groceries', '🛒', '#3B82F6', true),
	(gen_random_uuid(), null, 'Utilities', '💡', '#F59E0B', true),
	(gen_random_uuid(), null, 'Transport', '🚗', '#8B5CF6', true),
	(gen_random_uuid(), null, 'Dining', '🍽️', '#EF4444', true),
	(gen_random_uuid(), null, 'Health', '🏥', '#14B8A6', true),
	(gen_random_uuid(), null, 'Education', '📚', '#6366F1', true),
	(gen_random_uuid(), null, 'Shopping', '🛍️', '#EC4899', true),
	(gen_random_uuid(), null, 'Entertainment', '🎬', '#F97316', true),
	(gen_random_uuid(), null, 'Rent', '🏠', '#84CC16', true),
	(gen_random_uuid(), null, 'Savings', '🏦', '#06B6D4', true),
	(gen_random_uuid(), null, 'Other Expense', '📁', '#6B7280', true)
on conflict do nothing;

-- Optional example tag templates are user-specific; no global tag seeds by design.
