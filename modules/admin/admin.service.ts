import { getAdminClient } from "@config/supabaseAdminClient";

export async function getDashboardStats() {
  const supabase = getAdminClient();

  const [usersResult, transactionsResult, budgetsResult] = await Promise.all([
    supabase.from("profiles").select("*", { count: "exact", head: true }),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase.from("budgets").select("*", { count: "exact", head: true }),
  ]);

  return {
    totalUsers: usersResult.count || 0,
    totalTransactions: transactionsResult.count || 0,
    totalBudgets: budgetsResult.count || 0,
  };
}
