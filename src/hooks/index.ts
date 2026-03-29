/**
 * FinSight — Hooks barrel export
 */
export { useAuth } from "./useAuth";
export {
  useTransactions,
  useTransaction,
  useCreateTransaction,
  useUpdateTransaction,
  useDeleteTransaction,
} from "./useTransactions";
export {
  useBudgets,
  useBudget,
  useCreateBudget,
  useUpdateBudget,
  useDeleteBudget,
} from "./useBudgets";
export { useDashboardSummary, useAnalyticsData } from "./useAnalytics";
export { useAlerts, useDismissAlert, useMarkAlertRead } from "./useAlerts";
export { useCategories, useCreateCategory, useSearch } from "./useCategories";
export { useInsights, useGenerateInsights, useDismissInsight } from "./useInsights";
