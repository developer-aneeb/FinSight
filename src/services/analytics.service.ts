/**
 * FinSight — Analytics Service (Backend)
 */
import { getSupabaseServiceClient } from "../config/supabase";
import logger from "../utils/logger";
import { toISODate } from "../helpers/date.helper";
import { DashboardSummary, AnalyticsData } from "../types";

const supabase = () => getSupabaseServiceClient();

/** Get dashboard summary for the current month */
export async function getDashboardSummary(userId: string): Promise<DashboardSummary> {
  const now = new Date();
  const monthStart = toISODate(new Date(now.getFullYear(), now.getMonth(), 1));
  const monthEnd = toISODate(new Date(now.getFullYear(), now.getMonth() + 1, 0));

  // Current month transactions
  const { data: transactions } = await supabase()
    .from("transactions")
    .select("*, category:categories(name, icon, color)")
    .eq("user_id", userId)
    .gte("transaction_date", monthStart)
    .lte("transaction_date", monthEnd)
    .order("transaction_date", { ascending: false });

  const txns = transactions || [];

  let totalIncome = 0;
  let totalExpenses = 0;
  const categoryTotals: Record<string, { name: string; icon: string; color: string; total: number }> = {};

  for (const t of txns) {
    const amt = Number(t.amount);
    if (t.type === "income") {
      totalIncome += amt;
    } else {
      totalExpenses += amt;
      const cat = t.category as { name: string; icon: string; color: string } | null;
      if (cat) {
        const key = cat.name;
        if (!categoryTotals[key]) categoryTotals[key] = { ...cat, total: 0 };
        categoryTotals[key].total += amt;
      }
    }
  }

  const topCategories = Object.values(categoryTotals)
    .sort((a, b) => b.total - a.total)
    .slice(0, 5)
    .map((c) => ({
      category_name: c.name,
      category_icon: c.icon,
      category_color: c.color,
      total: c.total,
      percentage: totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 100) : 0,
    }));

  // Monthly trend (last 6 months)
  const monthlyTrend = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const start = toISODate(d);
    const end = toISODate(new Date(d.getFullYear(), d.getMonth() + 1, 0));

    const { data: monthTxns } = await supabase()
      .from("transactions")
      .select("type, amount")
      .eq("user_id", userId)
      .gte("transaction_date", start)
      .lte("transaction_date", end);

    let inc = 0;
    let exp = 0;
    for (const t of monthTxns || []) {
      if (t.type === "income") inc += Number(t.amount);
      else exp += Number(t.amount);
    }

    monthlyTrend.push({
      month: d.toLocaleDateString("en", { month: "short", year: "numeric" }),
      income: inc,
      expenses: exp,
    });
  }

  const recentTransactions = txns.slice(0, 5);

  // Active budgets
  const { data: budgets } = await supabase()
    .from("budgets")
    .select("*, category:categories(*)")
    .eq("user_id", userId)
    .eq("is_active", true);

  // Unread alerts count
  const { count } = await supabase()
    .from("alerts")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId)
    .eq("status", "unread");

  return {
    total_income: totalIncome,
    total_expenses: totalExpenses,
    net_balance: totalIncome - totalExpenses,
    transaction_count: txns.length,
    top_categories: topCategories,
    monthly_trend: monthlyTrend,
    recent_transactions: recentTransactions,
    active_budgets: budgets || [],
    unread_alerts: count || 0,
  };
}

/** Get detailed analytics data */
export async function getAnalyticsData(
  userId: string,
  startDate: string,
  endDate: string
): Promise<AnalyticsData> {
  const { data: transactions } = await supabase()
    .from("transactions")
    .select("*, category:categories(name, icon, color)")
    .eq("user_id", userId)
    .gte("transaction_date", startDate)
    .lte("transaction_date", endDate)
    .order("transaction_date");

  const txns = transactions || [];

  const catMap: Record<string, { amount: number; color: string; icon: string }> = {};
  const dailyMap: Record<string, number> = {};
  let totalIncome = 0;
  let totalExpenses = 0;

  for (const t of txns) {
    const amt = Number(t.amount);
    if (t.type === "income") {
      totalIncome += amt;
    } else {
      totalExpenses += amt;
      const cat = t.category as { name: string; icon: string; color: string } | null;
      const catName = cat?.name || "Uncategorized";
      if (!catMap[catName]) {
        catMap[catName] = { amount: 0, color: cat?.color || "#9CA3AF", icon: cat?.icon || "📋" };
      }
      catMap[catName].amount += amt;

      const day = t.transaction_date;
      dailyMap[day] = (dailyMap[day] || 0) + amt;
    }
  }

  const spendingByCategory = Object.entries(catMap).map(([category, v]) => ({
    category,
    ...v,
  }));

  const dailySpending = Object.entries(dailyMap)
    .map(([date, amount]) => ({ date, amount }))
    .sort((a, b) => a.date.localeCompare(b.date));

  const start = new Date(startDate);
  const end = new Date(endDate);
  const daysDiff = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000));

  return {
    spending_by_category: spendingByCategory,
    daily_spending: dailySpending,
    monthly_comparison: [],
    savings_rate: totalIncome > 0 ? Math.round(((totalIncome - totalExpenses) / totalIncome) * 100) : 0,
    avg_daily_spend: Math.round(totalExpenses / daysDiff),
  };
}
