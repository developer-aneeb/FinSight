import { getAdminClient } from "@config/supabaseAdminClient";

export interface AdminDashboardStats {
  totalUsers: number;
  totalAdmins: number;
  totalStandardUsers: number;
  totalTransactions: number;
  totalBudgets: number;
  totalUnreadAlerts: number;
  criticalUnreadAlerts: number;
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  monthlyTrend: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
  roleDistribution: Array<{
    role: "admin" | "user";
    count: number;
  }>;
  alertsBySeverity: Array<{
    severity: "info" | "warning" | "critical";
    total: number;
    unread: number;
  }>;
}

export interface AdminNotificationRow {
  id: string;
  user_id: string;
  user_email: string;
  user_full_name: string;
  title: string;
  message: string;
  severity: "info" | "warning" | "critical";
  status: "unread" | "read" | "dismissed";
  created_at: string;
}

export async function getDashboardStats() {
  const supabase = getAdminClient();

  const [
    usersResult,
    transactionsResult,
    budgetsResult,
    alertsResult,
    monthlyFinancialsResult,
  ] = await Promise.all([
    supabase.from("users").select("*", { count: "exact", head: true }),
    supabase.from("transactions").select("*", { count: "exact", head: true }),
    supabase.from("budgets").select("*", { count: "exact", head: true }),
    supabase.from("alerts").select("severity, status"),
    supabase.from("user_monthly_financials").select("month_start, income_total, expense_total"),
  ]);

  const [adminRole, userRole] = await Promise.all([
    supabase.from("roles").select("id").eq("name", "admin").maybeSingle(),
    supabase.from("roles").select("id").eq("name", "user").maybeSingle(),
  ]);

  const [adminUsersCount, standardUsersCount] = await Promise.all([
    adminRole.data?.id
      ? supabase.from("users").select("*", { count: "exact", head: true }).eq("role_id", adminRole.data.id)
      : Promise.resolve({ count: 0 }),
    userRole.data?.id
      ? supabase.from("users").select("*", { count: "exact", head: true }).eq("role_id", userRole.data.id)
      : Promise.resolve({ count: 0 }),
  ]);

  const alerts = (alertsResult.data || []) as Array<{ severity?: string; status?: string }>;
  const monthlyFinancials = (monthlyFinancialsResult.data || []) as Array<{
    month_start?: string;
    income_total?: number;
    expense_total?: number;
  }>;

  const monthlyTrendMap = new Map<string, { income: number; expenses: number }>();

  for (const item of monthlyFinancials) {
    const month = String(item.month_start || "").slice(0, 7);
    if (!month) {
      continue;
    }

    const bucket = monthlyTrendMap.get(month) || { income: 0, expenses: 0 };
    bucket.income += Number(item.income_total || 0);
    bucket.expenses += Number(item.expense_total || 0);
    monthlyTrendMap.set(month, bucket);
  }

  const monthlyTrend = Array.from(monthlyTrendMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .slice(-6)
    .map(([month, value]) => ({ month, income: value.income, expenses: value.expenses }));

  const totalIncome = monthlyFinancials.reduce((sum, item) => sum + Number(item.income_total || 0), 0);
  const totalExpenses = monthlyFinancials.reduce((sum, item) => sum + Number(item.expense_total || 0), 0);

  const roleDistribution = [
    {
      role: "admin" as const,
      count: adminUsersCount.count || 0,
    },
    {
      role: "user" as const,
      count: standardUsersCount.count || 0,
    },
  ];

  const alertsBySeverity = ["info", "warning", "critical"].map((severity) => ({
    severity: severity as "info" | "warning" | "critical",
    total: alerts.filter((alert) => alert.severity === severity).length,
    unread: alerts.filter((alert) => alert.severity === severity && alert.status === "unread").length,
  }));

  return {
    totalUsers: usersResult.count || 0,
    totalAdmins: adminUsersCount.count || 0,
    totalStandardUsers: standardUsersCount.count || 0,
    totalTransactions: transactionsResult.count || 0,
    totalBudgets: budgetsResult.count || 0,
    totalUnreadAlerts: alerts.filter((alert) => alert.status === "unread").length,
    criticalUnreadAlerts: alerts.filter(
      (alert) => alert.status === "unread" && alert.severity === "critical"
    ).length,
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    monthlyTrend,
    roleDistribution,
    alertsBySeverity,
  };
}

export async function listAdminNotifications(limit = 20): Promise<AdminNotificationRow[]> {
  const supabase = getAdminClient();

  const { data, error } = await supabase
    .from("alerts")
    .select("id, title, message, severity, status, created_at")
    .eq("is_system", true)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error || !data) {
    return [];
  }

  return (data as Array<Record<string, unknown>>).map((row) => {
    return {
      id: String(row.id || ""),
      user_id: "",
      user_email: "Platform",
      user_full_name: "",
      title: String(row.title || ""),
      message: String(row.message || ""),
      severity: (row.severity as AdminNotificationRow["severity"]) || "info",
      status: (row.status as AdminNotificationRow["status"]) || "unread",
      created_at: String(row.created_at || ""),
    };
  });
}
