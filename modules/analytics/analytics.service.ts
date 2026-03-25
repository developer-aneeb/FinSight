import { getAdminClient } from "@config/supabaseAdminClient";

interface DashboardSummaryResponse {
  totalIncome: number;
  totalExpenses: number;
  netBalance: number;
  transactionCount: number;
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
  recentTransactions: unknown[];
  activeBudgets: unknown[];
  unreadAlerts: number;
}

interface DetailedAnalyticsResponse {
  spendingByCategory: Array<{
    category: string;
    amount: number;
    color: string;
    icon: string;
  }>;
  dailySpending: Array<{
    date: string;
    amount: number;
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

const EMPTY_DASHBOARD: DashboardSummaryResponse = {
  totalIncome: 0,
  totalExpenses: 0,
  netBalance: 0,
  transactionCount: 0,
  topCategories: [],
  monthlyTrend: [],
  recentTransactions: [],
  activeBudgets: [],
  unreadAlerts: 0,
};

const EMPTY_DETAILED: DetailedAnalyticsResponse = {
  spendingByCategory: [],
  dailySpending: [],
  monthlyComparison: [],
  savingsRate: 0,
  avgDailySpend: 0,
};

export async function getDashboardSummary(userId: string): Promise<DashboardSummaryResponse> {
  const supabase = getAdminClient();

  const [transactionsResult, budgetsResult, alertsResult, monthlySummaryResult] = await Promise.all([
    supabase
      .from("transactions")
      .select("id, type, amount, transaction_date, description, category:categories(name, icon, color)")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false }),
    supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("alerts")
      .select("id, status")
      .eq("user_id", userId),
    supabase
      .from("user_monthly_financials")
      .select("month_start, income_total, expense_total")
      .eq("user_id", userId)
      .order("month_start", { ascending: true }),
  ]);

  if (transactionsResult.error && budgetsResult.error && alertsResult.error) {
    return EMPTY_DASHBOARD;
  }

  const transactions = (transactionsResult.data || []) as Array<Record<string, unknown>>;
  const budgets = (budgetsResult.data || []) as unknown[];
  const alerts = (alertsResult.data || []) as Array<{ status?: string }>;

  const totalIncome = transactions
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const totalExpenses = transactions
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const totalExpenseBase = totalExpenses > 0 ? totalExpenses : 1;

  const expenseByCategory = new Map<string, { total: number; category_icon: string; category_color: string }>();

  for (const transaction of transactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const category = (transaction.category || {}) as { name?: string; icon?: string; color?: string };
    const key = category.name || "Uncategorized";
    const previous = expenseByCategory.get(key) || {
      total: 0,
      category_icon: category.icon || "📁",
      category_color: category.color || "#6B7280",
    };

    previous.total += Number(transaction.amount || 0);
    expenseByCategory.set(key, previous);
  }

  const topCategories = Array.from(expenseByCategory.entries())
    .map(([category_name, value]) => ({
      category_name,
      category_icon: value.category_icon,
      category_color: value.category_color,
      total: value.total,
      percentage: Number(((value.total / totalExpenseBase) * 100).toFixed(2)),
    }))
    .sort((left, right) => right.total - left.total)
    .slice(0, 6);

  let monthlyTrend: Array<{ month: string; income: number; expenses: number }> = [];

  if (!monthlySummaryResult.error && monthlySummaryResult.data && monthlySummaryResult.data.length > 0) {
    monthlyTrend = monthlySummaryResult.data
      .slice(-6)
      .map((entry) => ({
        month: String(entry.month_start).slice(0, 7),
        income: Number(entry.income_total || 0),
        expenses: Number(entry.expense_total || 0),
      }));
  } else {
    const monthlyMap = new Map<string, { income: number; expenses: number }>();
    for (const transaction of transactions) {
      const rawDate = String(transaction.transaction_date || "");
      if (!rawDate) {
        continue;
      }

      const month = rawDate.slice(0, 7);
      const bucket = monthlyMap.get(month) || { income: 0, expenses: 0 };

      if (transaction.type === "income") {
        bucket.income += Number(transaction.amount || 0);
      } else if (transaction.type === "expense") {
        bucket.expenses += Number(transaction.amount || 0);
      }

      monthlyMap.set(month, bucket);
    }

    monthlyTrend = Array.from(monthlyMap.entries())
      .sort(([left], [right]) => left.localeCompare(right))
      .slice(-6)
      .map(([month, value]) => ({ month, income: value.income, expenses: value.expenses }));
  }

  const recentTransactions = transactions.slice(0, 5);
  const unreadAlerts = alerts.filter((item) => item.status === "unread").length;

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount: transactions.length,
    topCategories,
    monthlyTrend,
    recentTransactions,
    activeBudgets: budgets,
    unreadAlerts,
  };
}

export async function getDetailedAnalytics(userId: string, month?: string): Promise<DetailedAnalyticsResponse> {
  const supabase = getAdminClient();

  let query = supabase
    .from("transactions")
    .select("type, amount, transaction_date, category:categories(name, icon, color)")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: true });

  if (month) {
    query = query.gte("transaction_date", `${month}-01`).lte("transaction_date", `${month}-31`);
  }

  const { data, error } = await query;

  if (error || !data) {
    return EMPTY_DETAILED;
  }

  const rows = data as Array<Record<string, unknown>>;

  const spendingByCategoryMap = new Map<string, { amount: number; color: string; icon: string }>();
  const dailySpendingMap = new Map<string, number>();

  let totalIncome = 0;
  let totalExpenses = 0;

  for (const row of rows) {
    const amount = Number(row.amount || 0);
    const type = String(row.type || "");
    const date = String(row.transaction_date || "").slice(0, 10);

    if (type === "income") {
      totalIncome += amount;
      continue;
    }

    if (type !== "expense") {
      continue;
    }

    totalExpenses += amount;

    if (date) {
      dailySpendingMap.set(date, (dailySpendingMap.get(date) || 0) + amount);
    }

    const category = (row.category || {}) as { name?: string; icon?: string; color?: string };
    const categoryName = category.name || "Uncategorized";
    const current = spendingByCategoryMap.get(categoryName) || {
      amount: 0,
      color: category.color || "#6B7280",
      icon: category.icon || "📁",
    };
    current.amount += amount;
    spendingByCategoryMap.set(categoryName, current);
  }

  const spendingByCategory = Array.from(spendingByCategoryMap.entries()).map(([category, value]) => ({
    category,
    amount: value.amount,
    color: value.color,
    icon: value.icon,
  }));

  const dailySpending = Array.from(dailySpendingMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, amount]) => ({ date, amount }));

  const monthLabel = month || new Date().toISOString().slice(0, 7);
  const monthlyComparison = [
    {
      month: monthLabel,
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalIncome - totalExpenses,
    },
  ];

  const savingsRate = totalIncome > 0 ? Number((((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(2)) : 0;
  const avgDailySpend = dailySpending.length > 0 ? Number((totalExpenses / dailySpending.length).toFixed(2)) : 0;

  return {
    spendingByCategory,
    dailySpending,
    monthlyComparison,
    savingsRate,
    avgDailySpend,
  };
}
