import { getAdminClient } from "@config/supabaseAdminClient";
import { syncRecurringTransactionsFastPath } from "@modules/transactions/transactions.service";

interface DashboardSummaryResponse {
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
  highLevelTrends: {
    week: { income: 0, expenses: 0, net: 0 },
    month: { income: 0, expenses: 0, net: 0 },
    year: { income: 0, expenses: 0, net: 0 },
  },
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

function resolveTargetDate(month?: string): Date {
  if (!month) {
    return new Date();
  }

  if (!/^\d{4}-\d{2}$/.test(month)) {
    return new Date();
  }

  const candidate = new Date(`${month}-01T00:00:00Z`);
  if (Number.isNaN(candidate.getTime())) {
    return new Date();
  }

  return candidate;
}

export async function getDashboardSummary(userId: string): Promise<DashboardSummaryResponse> {
  const supabase = getAdminClient();
  await syncRecurringTransactionsFastPath(userId);
  const today = new Date();
  const weekStart = new Date(today);
  weekStart.setDate(today.getDate() - 6);

  const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
  const yearStart = new Date(today.getFullYear(), 0, 1);

  const weekStartIso = weekStart.toISOString().slice(0, 10);
  const monthStartIso = monthStart.toISOString().slice(0, 10);
  const yearStartIso = yearStart.toISOString().slice(0, 10);

  const [
    weekTransactionsResult,
    monthTransactionsResult,
    transactionCountResult,
    recentTransactionsResult,
    budgetsResult,
    alertsResult,
    monthlySummaryResult,
  ] = await Promise.all([
    supabase
      .from("transactions")
      .select("type, amount, transaction_date")
      .eq("user_id", userId)
      .gte("transaction_date", weekStartIso),
    supabase
      .from("transactions")
      .select("type, amount, category_id")
      .eq("user_id", userId)
      .gte("transaction_date", monthStartIso),
    supabase
      .from("transactions")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId),
    supabase
      .from("transactions")
      .select("id, type, amount, transaction_date, description, category:categories(name, icon, color)")
      .eq("user_id", userId)
      .order("transaction_date", { ascending: false })
      .limit(5),
    supabase
      .from("budgets")
      .select("*")
      .eq("user_id", userId)
      .eq("is_active", true)
      .order("created_at", { ascending: false }),
    supabase
      .from("alerts")
      .select("id", { count: "exact", head: true })
      .eq("user_id", userId)
      .eq("status", "unread"),
    supabase
      .from("user_monthly_financials")
      .select("month_start, income_total, expense_total")
      .eq("user_id", userId)
      .gte("month_start", yearStartIso)
      .order("month_start", { ascending: true }),
  ]);

  if (weekTransactionsResult.error && monthTransactionsResult.error && budgetsResult.error && alertsResult.error) {
    return EMPTY_DASHBOARD;
  }

  const weekTransactions = (weekTransactionsResult.data || []) as Array<Record<string, unknown>>;
  const monthTransactions = (monthTransactionsResult.data || []) as Array<Record<string, unknown>>;
  const recentTransactions = (recentTransactionsResult.data || []) as Array<Record<string, unknown>>;
  const budgets = (budgetsResult.data || []) as unknown[];
  const monthlySummaryRows = (monthlySummaryResult.data || []) as Array<{
    month_start?: string;
    income_total?: number;
    expense_total?: number;
  }>;

  const totalIncome = monthTransactions
    .filter((entry) => entry.type === "income")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const totalExpenses = monthTransactions
    .filter((entry) => entry.type === "expense")
    .reduce((sum, entry) => sum + Number(entry.amount || 0), 0);

  const trendAccumulator = {
    week: { income: 0, expenses: 0 },
    month: { income: 0, expenses: 0 },
    year: { income: 0, expenses: 0 },
  };

  for (const transaction of weekTransactions) {
    const amount = Number(transaction.amount || 0);
    const date = String(transaction.transaction_date || "");
    const type = String(transaction.type || "");

    if (!date || (type !== "income" && type !== "expense")) {
      continue;
    }

    if (date >= weekStartIso) {
      if (type === "income") {
        trendAccumulator.week.income += amount;
      } else {
        trendAccumulator.week.expenses += amount;
      }
    }
  }

  for (const transaction of monthTransactions) {
    const amount = Number(transaction.amount || 0);
    const type = String(transaction.type || "");
    if (type === "income") {
      trendAccumulator.month.income += amount;
    } else if (type === "expense") {
      trendAccumulator.month.expenses += amount;
    }
  }

  let monthlyTrend: Array<{ month: string; income: number; expenses: number }> = [];

  if (monthlySummaryRows.length > 0) {
    monthlyTrend = monthlySummaryRows
      .slice(-12)
      .map((entry) => ({
        month: String(entry.month_start).slice(0, 7),
        income: Number(entry.income_total || 0),
        expenses: Number(entry.expense_total || 0),
      }));

    for (const entry of monthlySummaryRows) {
      trendAccumulator.year.income += Number(entry.income_total || 0);
      trendAccumulator.year.expenses += Number(entry.expense_total || 0);
    }
  } else {
    const { data: yearTx, error: yearError } = await supabase
      .from("transactions")
      .select("type, amount, transaction_date")
      .eq("user_id", userId)
      .gte("transaction_date", yearStartIso);

    if (!yearError && yearTx) {
      const monthlyMap = new Map<string, { income: number; expenses: number }>();
      for (const transaction of yearTx as Array<Record<string, unknown>>) {
        const rawDate = String(transaction.transaction_date || "");
        if (!rawDate) {
          continue;
        }

        const month = rawDate.slice(0, 7);
        const amount = Number(transaction.amount || 0);
        const type = String(transaction.type || "");
        const bucket = monthlyMap.get(month) || { income: 0, expenses: 0 };

        if (type === "income") {
          bucket.income += amount;
          trendAccumulator.year.income += amount;
        } else if (type === "expense") {
          bucket.expenses += amount;
          trendAccumulator.year.expenses += amount;
        }

        monthlyMap.set(month, bucket);
      }

      monthlyTrend = Array.from(monthlyMap.entries())
        .sort(([left], [right]) => left.localeCompare(right))
        .slice(-12)
        .map(([month, value]) => ({ month, income: value.income, expenses: value.expenses }));
    }
  }

  const highLevelTrends = {
    week: {
      income: trendAccumulator.week.income,
      expenses: trendAccumulator.week.expenses,
      net: trendAccumulator.week.income - trendAccumulator.week.expenses,
    },
    month: {
      income: trendAccumulator.month.income,
      expenses: trendAccumulator.month.expenses,
      net: trendAccumulator.month.income - trendAccumulator.month.expenses,
    },
    year: {
      income: trendAccumulator.year.income,
      expenses: trendAccumulator.year.expenses,
      net: trendAccumulator.year.income - trendAccumulator.year.expenses,
    },
  };

  const totalExpenseBase = totalExpenses > 0 ? totalExpenses : 1;

  const expenseByCategory = new Map<string, number>();

  for (const transaction of monthTransactions) {
    if (transaction.type !== "expense") {
      continue;
    }

    const key = String(transaction.category_id || "uncategorized");
    expenseByCategory.set(key, (expenseByCategory.get(key) || 0) + Number(transaction.amount || 0));
  }

  const categoryIds = Array.from(expenseByCategory.keys()).filter((id) => id !== "uncategorized");
  const categoryById = new Map<string, { name: string; icon: string; color: string }>();

  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, icon, color")
      .in("id", categoryIds);

    for (const category of (categories || []) as Array<{ id?: string; name?: string; icon?: string; color?: string }>) {
      const id = String(category.id || "");
      if (!id) {
        continue;
      }

      categoryById.set(id, {
        name: String(category.name || "Uncategorized"),
        icon: String(category.icon || "📁"),
        color: String(category.color || "#6B7280"),
      });
    }
  }

  const topCategories = Array.from(expenseByCategory.entries())
    .map(([categoryId, total]) => {
      const category = categoryById.get(categoryId);
      return {
        category_name: category?.name || "Uncategorized",
        category_icon: category?.icon || "📁",
        category_color: category?.color || "#6B7280",
        total,
        percentage: Number(((total / totalExpenseBase) * 100).toFixed(2)),
      };
    })
    .sort((left, right) => right.total - left.total)
    .slice(0, 6);

  const unreadAlerts = Number(alertsResult.count || 0);
  const transactionCount = Number(transactionCountResult.count || 0);

  return {
    totalIncome,
    totalExpenses,
    netBalance: totalIncome - totalExpenses,
    transactionCount,
    highLevelTrends,
    topCategories,
    monthlyTrend,
    recentTransactions,
    activeBudgets: budgets,
    unreadAlerts,
  };
}

export async function getDetailedAnalytics(userId: string, month?: string): Promise<DetailedAnalyticsResponse> {
  const supabase = getAdminClient();
  await syncRecurringTransactionsFastPath(userId);

  let query = supabase
    .from("transactions")
    .select("type, amount, transaction_date, category_id")
    .eq("user_id", userId)
    .order("transaction_date", { ascending: true });

  const targetDate = resolveTargetDate(month);
  
  // Safely calculate previous and current months without timezone/day-of-month bugs
  const targetYear = month ? targetDate.getUTCFullYear() : targetDate.getFullYear();
  const targetMonth = month ? targetDate.getUTCMonth() : targetDate.getMonth(); // 0-based
  
  let prevYear = targetYear;
  let prevMonthNum = targetMonth - 1;
  if (prevMonthNum < 0) {
    prevMonthNum = 11;
    prevYear -= 1;
  }

  const currMonthIso = `${targetYear}-${String(targetMonth + 1).padStart(2, "0")}`;
  const prevMonthIso = `${prevYear}-${String(prevMonthNum + 1).padStart(2, "0")}`;

  if (month) {
    const lastDayOfMonth = new Date(targetYear, targetMonth + 1, 0).getDate();
    const lastDayIso = `${currMonthIso}-${lastDayOfMonth.toString().padStart(2, "0")}`;
    
    query = query.gte("transaction_date", `${prevMonthIso}-01`).lte("transaction_date", lastDayIso);
  } else {
    // If no month provided, bound to start of previous month safely
    query = query.gte("transaction_date", `${prevMonthIso}-01`);
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
  let prevTotalIncome = 0;
  let prevTotalExpenses = 0;

  for (const row of rows) {
    const amount = Number(row.amount || 0);
    const type = String(row.type || "");
    const date = String(row.transaction_date || "").slice(0, 10);
    const rowMonth = date.slice(0, 7);

    // If it belongs to previous month, tally for comparison and continue
    if (rowMonth === prevMonthIso) {
      if (type === "income") prevTotalIncome += amount;
      if (type === "expense") prevTotalExpenses += amount;
      continue;
    }

    // Only process current month beyond here
    if (rowMonth !== currMonthIso) continue;

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

    const categoryId = String(row.category_id || "uncategorized");
    const current = spendingByCategoryMap.get(categoryId) || {
      amount: 0,
      color: "#6B7280",
      icon: "📁",
    };
    current.amount += amount;
    spendingByCategoryMap.set(categoryId, current);
  }

  const categoryIds = Array.from(spendingByCategoryMap.keys()).filter((id) => id !== "uncategorized");
  const categoryById = new Map<string, { name: string; icon: string; color: string }>();

  if (categoryIds.length > 0) {
    const { data: categories } = await supabase
      .from("categories")
      .select("id, name, icon, color")
      .in("id", categoryIds);

    for (const category of (categories || []) as Array<{ id?: string; name?: string; icon?: string; color?: string }>) {
      const id = String(category.id || "");
      if (!id) {
        continue;
      }

      categoryById.set(id, {
        name: String(category.name || "Uncategorized"),
        icon: String(category.icon || "📁"),
        color: String(category.color || "#6B7280"),
      });
    }
  }

  const spendingByCategory = Array.from(spendingByCategoryMap.entries())
    .map(([categoryId, value]) => {
      const category = categoryById.get(categoryId);
      return {
        category: category?.name || "Uncategorized",
        amount: value.amount,
        color: category?.color || value.color,
        icon: category?.icon || value.icon,
      };
    })
    .sort((left, right) => right.amount - left.amount);

  const dailySpending = Array.from(dailySpendingMap.entries())
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([date, amount]) => ({ date, amount }));

  const monthlyComparison = [
    {
      month: prevMonthIso,
      income: prevTotalIncome,
      expenses: prevTotalExpenses,
      savings: prevTotalIncome - prevTotalExpenses,
    },
    {
      month: currMonthIso,
      income: totalIncome,
      expenses: totalExpenses,
      savings: totalIncome - totalExpenses,
    },
  ];

  const savingsRate = totalIncome > 0 ? Number((((totalIncome - totalExpenses) / totalIncome) * 100).toFixed(2)) : 0;
  // Calculate average daily spend correctly by taking days in current month up to today if it's the current month, or the whole month if past
  const isCurrentMonth = currMonthIso === new Date().toISOString().slice(0, 7);
  const daysInMonth = isCurrentMonth ? new Date().getDate() : new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
  const avgDailySpend = daysInMonth > 0 ? Number((totalExpenses / daysInMonth).toFixed(2)) : 0;

  return {
    spendingByCategory,
    dailySpending,
    monthlyComparison,
    savingsRate,
    avgDailySpend,
  };
}
