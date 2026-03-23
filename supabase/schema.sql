-- ============================================================
-- FinSight — Full Database Schema
-- PostgreSQL / Supabase
-- ============================================================

-- ─── Extensions ─────────────────────────────────────────────
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ─── ENUM Types ─────────────────────────────────────────────
CREATE TYPE transaction_type AS ENUM ('income', 'expense');
CREATE TYPE recurrence_interval AS ENUM ('none', 'daily', 'weekly', 'monthly', 'yearly');
CREATE TYPE alert_severity AS ENUM ('info', 'warning', 'critical');
CREATE TYPE alert_status AS ENUM ('unread', 'read', 'dismissed');
CREATE TYPE user_role AS ENUM ('user', 'admin');
CREATE TYPE budget_period AS ENUM ('weekly', 'monthly', 'yearly');

-- ─── 1. Users (extends Supabase auth.users) ────────────────
CREATE TABLE public.profiles (
  id              UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  full_name       TEXT NOT NULL DEFAULT '',
  email           TEXT NOT NULL,
  avatar_url      TEXT,
  preferred_currency TEXT NOT NULL DEFAULT 'PKR',
  language        TEXT NOT NULL DEFAULT 'en', -- 'en' | 'ur'
  role            user_role NOT NULL DEFAULT 'user',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ─── 2. Categories ──────────────────────────────────────────
CREATE TABLE public.categories (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  icon            TEXT DEFAULT '📁',
  color           TEXT DEFAULT '#6B7280',
  parent_id       UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  is_system       BOOLEAN NOT NULL DEFAULT false,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_categories_user ON public.categories(user_id);

-- ─── 3. Tags ────────────────────────────────────────────────
CREATE TABLE public.tags (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  name            TEXT NOT NULL,
  color           TEXT DEFAULT '#3B82F6',
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, name)
);

-- ─── 4. Transactions ───────────────────────────────────────
CREATE TABLE public.transactions (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  type            transaction_type NOT NULL,
  amount          DECIMAL(12,2) NOT NULL CHECK (amount > 0),
  currency        TEXT NOT NULL DEFAULT 'PKR',
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  description     TEXT DEFAULT '',
  notes           TEXT DEFAULT '',
  transaction_date DATE NOT NULL DEFAULT CURRENT_DATE,
  receipt_url     TEXT,
  is_recurring    BOOLEAN NOT NULL DEFAULT false,
  recurrence      recurrence_interval NOT NULL DEFAULT 'none',
  next_recurrence DATE,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_transactions_user      ON public.transactions(user_id);
CREATE INDEX idx_transactions_date      ON public.transactions(transaction_date DESC);
CREATE INDEX idx_transactions_category  ON public.transactions(category_id);
CREATE INDEX idx_transactions_type      ON public.transactions(type);

-- ─── 5. Transaction Tags (M2M) ─────────────────────────────
CREATE TABLE public.transaction_tags (
  transaction_id  UUID NOT NULL REFERENCES public.transactions(id) ON DELETE CASCADE,
  tag_id          UUID NOT NULL REFERENCES public.tags(id) ON DELETE CASCADE,
  PRIMARY KEY (transaction_id, tag_id)
);

-- ─── 6. Budgets ────────────────────────────────────────────
CREATE TABLE public.budgets (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  category_id     UUID REFERENCES public.categories(id) ON DELETE SET NULL,
  name            TEXT NOT NULL,
  amount_limit    DECIMAL(12,2) NOT NULL CHECK (amount_limit > 0),
  spent           DECIMAL(12,2) NOT NULL DEFAULT 0,
  period          budget_period NOT NULL DEFAULT 'monthly',
  start_date      DATE NOT NULL DEFAULT CURRENT_DATE,
  end_date        DATE,
  is_active       BOOLEAN NOT NULL DEFAULT true,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_budgets_user ON public.budgets(user_id);

-- ─── 7. Alerts ─────────────────────────────────────────────
CREATE TABLE public.alerts (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  message         TEXT NOT NULL,
  severity        alert_severity NOT NULL DEFAULT 'info',
  status          alert_status NOT NULL DEFAULT 'unread',
  related_budget_id UUID REFERENCES public.budgets(id) ON DELETE SET NULL,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_alerts_user   ON public.alerts(user_id);
CREATE INDEX idx_alerts_status ON public.alerts(status);

-- ─── 8. Insights ───────────────────────────────────────────
CREATE TABLE public.insights (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id         UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  insight_type    TEXT NOT NULL DEFAULT 'spending_pattern',
  metadata        JSONB DEFAULT '{}',
  is_dismissed    BOOLEAN NOT NULL DEFAULT false,
  generated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_insights_user ON public.insights(user_id);

-- ─── 9. ElasticSearch Sync Table ────────────────────────────
-- Tracks which records have been indexed to ElasticSearch
CREATE TABLE public.es_sync_log (
  id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  table_name      TEXT NOT NULL,
  record_id       UUID NOT NULL,
  action          TEXT NOT NULL DEFAULT 'index', -- 'index' | 'delete'
  synced_at       TIMESTAMPTZ,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  error_message   TEXT
);

CREATE INDEX idx_es_sync_pending ON public.es_sync_log(synced_at) WHERE synced_at IS NULL;

-- ─── Functions ──────────────────────────────────────────────

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER set_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_transactions_updated_at
  BEFORE UPDATE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

CREATE TRIGGER set_budgets_updated_at
  BEFORE UPDATE ON public.budgets
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Auto-create profile on auth signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Budget spent amount recalculation
CREATE OR REPLACE FUNCTION public.recalculate_budget_spent()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE public.budgets b
  SET spent = COALESCE((
    SELECT SUM(t.amount)
    FROM public.transactions t
    WHERE t.user_id = b.user_id
      AND t.category_id = b.category_id
      AND t.type = 'expense'
      AND t.transaction_date >= b.start_date
      AND (b.end_date IS NULL OR t.transaction_date <= b.end_date)
  ), 0)
  WHERE b.user_id = COALESCE(NEW.user_id, OLD.user_id)
    AND b.is_active = true;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER after_transaction_change
  AFTER INSERT OR UPDATE OR DELETE ON public.transactions
  FOR EACH ROW EXECUTE FUNCTION public.recalculate_budget_spent();

-- ─── Row Level Security ─────────────────────────────────────

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.transaction_tags ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budgets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.insights ENABLE ROW LEVEL SECURITY;

-- Profiles: users can read/update their own profile; admins can read all
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (auth.uid() = id);

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Categories: users see system categories + their own
CREATE POLICY "Users see own and system categories"
  ON public.categories FOR SELECT
  USING (is_system = true OR user_id = auth.uid());

CREATE POLICY "Users manage own categories"
  ON public.categories FOR ALL
  USING (user_id = auth.uid());

-- Tags: users manage their own tags
CREATE POLICY "Users manage own tags"
  ON public.tags FOR ALL
  USING (user_id = auth.uid());

-- Transactions: users manage their own
CREATE POLICY "Users manage own transactions"
  ON public.transactions FOR ALL
  USING (user_id = auth.uid());

-- Transaction Tags: users manage tags on their own transactions
CREATE POLICY "Users manage own transaction tags"
  ON public.transaction_tags FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.transactions
      WHERE id = transaction_id AND user_id = auth.uid()
    )
  );

-- Budgets: users manage their own
CREATE POLICY "Users manage own budgets"
  ON public.budgets FOR ALL
  USING (user_id = auth.uid());

-- Alerts: users see their own
CREATE POLICY "Users see own alerts"
  ON public.alerts FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own alerts"
  ON public.alerts FOR UPDATE
  USING (user_id = auth.uid());

-- Insights: users see their own
CREATE POLICY "Users see own insights"
  ON public.insights FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users update own insights"
  ON public.insights FOR UPDATE
  USING (user_id = auth.uid());
