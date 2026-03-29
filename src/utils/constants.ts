/**
 * FinSight — Application Constants
 */

/** Default currency for Pakistan */
export const DEFAULT_CURRENCY = "PKR";

/** Currency formatter for PKR */
export const formatPKR = (amount: number): string => {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency: "PKR",
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
};

/** App name */
export const APP_NAME = "FinSight";

/** Pagination defaults */
export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

/** Date format for display */
export const DATE_FORMAT = "dd MMM yyyy";
export const DATE_TIME_FORMAT = "dd MMM yyyy, HH:mm";

/** Transaction type labels */
export const TRANSACTION_TYPE_LABELS: Record<string, string> = {
  income: "Income",
  expense: "Expense",
};

/** Budget period labels */
export const BUDGET_PERIOD_LABELS: Record<string, string> = {
  weekly: "Weekly",
  monthly: "Monthly",
  yearly: "Yearly",
};

/** Alert severity colors */
export const ALERT_SEVERITY_COLORS: Record<string, string> = {
  info: "text-blue-600 bg-blue-50 border-blue-200",
  warning: "text-amber-600 bg-amber-50 border-amber-200",
  critical: "text-red-600 bg-red-50 border-red-200",
};

/** Budget usage thresholds */
export const BUDGET_THRESHOLDS = {
  SAFE: 0.5,       // < 50% — green
  WARNING: 0.75,   // 50-75% — yellow
  DANGER: 0.9,     // 75-90% — orange
  EXCEEDED: 1.0,   // > 100% — red
} as const;

/** Routes */
export const ROUTES = {
  HOME: "/",
  LOGIN: "/login",
  SIGNUP: "/signup",
  FORGOT_PASSWORD: "/forgot-password",
  RESET_PASSWORD: "/reset-password",
  DASHBOARD: "/dashboard",
  TRANSACTIONS: "/transactions",
  TRANSACTION_DETAIL: (id: string) => `/transactions/${id}`,
  BUDGETS: "/budgets",
  INSIGHTS: "/insights",
  ANALYTICS: "/analytics",
  NOTIFICATIONS: "/notifications",
  SETTINGS: "/settings",
  PROFILE: "/profile",
  ADMIN: "/admin",
  ADMIN_USERS: "/admin/users",
  ADMIN_NOTIFICATIONS: "/admin/notifications",
} as const;

/** API Routes */
export const API_ROUTES = {
  AUTH: {
    LOGIN: "/api/auth/login",
    SIGNUP: "/api/auth/signup",
    LOGOUT: "/api/auth/logout",
  },
  TRANSACTIONS: "/api/transactions",
  TRANSACTION: (id: string) => `/api/transactions/${id}`,
  CATEGORIES: "/api/categories",
  BUDGETS: "/api/budgets",
  BUDGET: (id: string) => `/api/budgets/${id}`,
  INSIGHTS: "/api/insights",
  ALERTS: "/api/alerts",
  ANALYTICS: "/api/analytics",
  SEARCH: "/api/search",
  UPLOAD: "/api/upload",
  ADMIN_USERS: "/api/admin/users",
} as const;
