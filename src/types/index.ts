/**
 * FinSight — Core TypeScript Type Definitions
 * All shared types for the application
 */

// ─── Database Enums ─────────────────────────────────────────

export type TransactionType = string;
export type RecurrenceInterval = string;
export type AlertSeverity = string;
export type AlertStatus = string;
export type UserRole = "user" | "admin";
export type BudgetPeriod = string;

// ─── Database Models ────────────────────────────────────────

export interface Profile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  address?: Record<string, any>;
  
  preferred_currency: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id: string | null;
  name: string;
  icon: string;
  color: string;
  parent_id: string | null;
  is_system: boolean;
  created_at: string;
}

export interface Tag {
  id: string;
  user_id: string;
  name: string;
  color: string;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  category_id: string | null;
  description: string;
  notes: string;
  transaction_date: string;
  is_recurring: boolean;
  recurrence: RecurrenceInterval;
  next_recurrence: string | null;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
  tags?: Tag[];
}

export interface Budget {
  id: string;
  user_id: string;
  category_id: string | null;
  name: string;
  amount_limit: number;
  spent: number;
  period: BudgetPeriod;
  start_date: string;
  end_date: string | null;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  // Joined fields
  category?: Category;
}

export interface Alert {
  id: string;
  user_id: string;
  title: string;
  message: string;
  severity: AlertSeverity;
  status: AlertStatus;
  related_budget_id: string | null;
  created_at: string;
}

export interface Insight {
  id: string;
  user_id: string;
  title: string;
  body: string;
  insight_type: string;
  metadata: Record<string, unknown>;
  is_dismissed: boolean;
  generated_at: string;
}

export interface InsightGenerationData {
  status: "reused_previous" | "regenerated_new";
  message: string;
  insights: Insight[];
  inputSignature: string;
}

// ─── API Request/Response Types ─────────────────────────────

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> extends ApiResponse<T[]> {
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  pagination?: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
}

export interface TransactionFilters {
  type?: TransactionType;
  category_id?: string;
  date_from?: string;
  date_to?: string;
  amount_min?: number;
  amount_max?: number;
  search?: string;
  tags?: string[];
  page?: number;
  pageSize?: number;
  sortBy?: "transaction_date" | "amount" | "created_at";
  sortOrder?: "asc" | "desc";
}

export interface CreateTransactionInput {
  type: TransactionType;
  amount: number;
  category_id?: string;
  description?: string;
  notes?: string;
  transaction_date?: string;
  is_recurring?: boolean;
  recurrence?: RecurrenceInterval;
  tags?: string[];
}

export interface UpdateTransactionInput extends Partial<CreateTransactionInput> {
  id: string;
}

export interface CreateBudgetInput {
  category_id?: string;
  name: string;
  amount_limit: number;
  period?: BudgetPeriod;
  start_date?: string;
  end_date?: string;
}

export interface UpdateBudgetInput extends Partial<CreateBudgetInput> {
  id: string;
  is_active?: boolean;
}

export interface DashboardSummary {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
  highLevelTrends: {
    week: { income: number; expenses: number; net: number };
    month: { income: number; expenses: number; net: number };
    year: { income: number; expenses: number; net: number };
  };
  topCategories: Array<{
    category_name: string;
    category_icon: string;
    category_color: string;
    total: number;
    percentage: number;
  }>;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  recentTransactions: Transaction[];
  activeBudgets: Budget[];
  unreadAlerts: number;
}

export interface AnalyticsData {
  spendingByCategory: Array<{
    category: string;
    amount: number;
    color: string;
    icon: string;
    total?: number;
    name?: string;
  }>;
  dailySpending: Array<{
    date: string;
    amount: number;
    total?: number;
  }>;
  monthlyComparison: Array<{
    month: string;
    income: number;
    expenses: number;
    savings: number;
  }>;
  savingsRate: number;
  avgDailySpend: number;
}

// ─── Auth Types ─────────────────────────────────────────────

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface SignupCredentials extends LoginCredentials {
  full_name: string;
}

export interface UpdateProfileInput {
  full_name?: string;
  phone?: string | null;
  address?: Record<string, any>;
  
  preferred_currency?: string;
}

export interface ForgotPasswordInput {
  email: string;
  redirectTo?: string;
}

export interface AuthState {
  user: Profile | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

// ─── Search Types ───────────────────────────────────────────

export interface SearchResult {
  transactions: Transaction[];
  total: number;
  query: string;
  filters_applied: Record<string, unknown>;
}
