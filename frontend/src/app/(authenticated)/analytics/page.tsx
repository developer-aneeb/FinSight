"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useAnalyticsData, useDashboardSummary } from "@/hooks/useAnalytics";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Button } from "@/components/ui/Button";
import { formatCurrency } from "@/utils/formatCurrency";
import { calcPercentage } from "@/utils/formatCurrency";
import {
  TrendingDown,
  CalendarDays,
  PiggyBank,
  BarChart3,
} from "lucide-react";

const MonthlyTrendChart = dynamic(
  () => import("@/components/dashboard/MonthlyTrendChart").then((mod) => mod.MonthlyTrendChart),
  { ssr: false, loading: () => <CardSkeleton className="h-72" /> }
);

const CategoryBreakdown = dynamic(
  () => import("@/components/dashboard/CategoryBreakdown").then((mod) => mod.CategoryBreakdown),
  { ssr: false, loading: () => <CardSkeleton className="h-72" /> }
);

const SpendingHeatmap = dynamic(
  () => import("@/components/analytics/SpendingHeatmap").then((mod) => mod.SpendingHeatmap),
  { ssr: false, loading: () => <CardSkeleton className="h-72" /> }
);

const ExportButton = dynamic(
  () => import("@/components/analytics/ExportButton").then((mod) => mod.ExportButton),
  { ssr: false }
);

export default function AnalyticsPage() {
  const [selectedMonth, setSelectedMonth] = useState<string>("");
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useAnalyticsData(selectedMonth || undefined);
  const { data: dashboardData } = useDashboardSummary();

  const analytics = data?.data;
  const dashboardSummary = dashboardData?.data;

  const hasDetailedData = useMemo(() => {
    if (!analytics) {
      return false;
    }

    const hasMonthlyNumbers = (analytics.monthlyComparison ?? []).some(
      (entry: any) =>
        (entry?.income ?? 0) > 0 ||
        (entry?.expenses ?? 0) > 0 ||
        (entry?.savings ?? 0) !== 0
    );

    return (
      (analytics.spendingByCategory?.length ?? 0) > 0 ||
      (analytics.dailySpending?.length ?? 0) > 0 ||
      hasMonthlyNumbers ||
      analytics.avgDailySpend > 0 ||
      analytics.savingsRate !== 0
    );
  }, [analytics]);

  // Calculate trends vs previous month
  const currentMonthData = analytics?.monthlyComparison?.[1];
  const prevMonthData = analytics?.monthlyComparison?.[0];
  
  const getTrend = (curr: number, prev: number, inverse = false) => {
    if (!prev) return undefined;
    const diff = curr - prev;
    const percent = Math.abs((diff / prev) * 100).toFixed(1);
    const isUp = diff >= 0;
    
    // If inverse is true, going UP is BAD ("down" visually/red)
    let direction = isUp ? "up" : "down";
    if (inverse) {
      direction = isUp ? "down" : "up";
    }

    return {
      direction,
      text: `${isUp ? '+' : '-'}${percent}% vs last month`,
    };
  };

  const spendTrend = currentMonthData && prevMonthData 
    ? getTrend(currentMonthData.expenses, prevMonthData.expenses, true) // Spending up is bad
    : undefined;
    
  const savingsTrend = currentMonthData && prevMonthData 
    ? getTrend(currentMonthData.savings, prevMonthData.savings, false) // Savings up is good
    : undefined;

  const monthOptions = useMemo(
    () => {
      const now = new Date();
      // Normalize to first day of month to avoid end-of-month rollover duplicates.
      const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const seen = new Set<string>();
      const options: Array<{ value: string; label: string }> = [];

      for (let i = 0; i < 6; i += 1) {
        const d = new Date(monthStart.getFullYear(), monthStart.getMonth() - i, 1);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        if (seen.has(value)) continue;
        seen.add(value);

        const label = d.toLocaleDateString("en-PK", {
          year: "numeric",
          month: "long",
        });

        options.push({ value, label });
      }

      return options;
    },
    []
  );

  const totalSpend = useMemo(() => {
    const detailedTotalSpend =
      analytics?.spendingByCategory?.reduce(
        (sum: number, c: any) => sum + (c.amount ?? c.total ?? 0),
        0
      ) ?? 0;

    return detailedTotalSpend > 0
      ? detailedTotalSpend
      : (dashboardSummary?.totalExpenses ?? 0);
  }, [analytics?.spendingByCategory, dashboardSummary?.totalExpenses]);

  const dailyTrendData = useMemo(() => {
    const detailedSeries =
      analytics?.dailySpending?.map((d: any) => ({
        month: d.date,
        income: 0,
        expenses: d.amount ?? d.total ?? 0,
      })) ?? [];

    return detailedSeries.length > 0
      ? detailedSeries
      : (dashboardSummary?.monthlyTrend ?? []);
  }, [analytics?.dailySpending, dashboardSummary?.monthlyTrend]);

  const categoryBreakdownData = useMemo(() => {
    const detailedBreakdown = (analytics?.spendingByCategory ?? []).map((c: any) => ({
      category_name: c.category ?? c.name ?? "",
      category_icon: c.icon ?? "📁",
      category_color: c.color ?? "#6B7280",
      total: c.amount ?? c.total ?? 0,
      percentage: totalSpend > 0 ? calcPercentage(c.amount ?? c.total ?? 0, totalSpend) : 0,
    }));

    return detailedBreakdown.length > 0
      ? detailedBreakdown
      : (
          dashboardSummary?.topCategories?.map((category) => ({
            category_name: category.category_name,
            category_icon: category.category_icon,
            category_color: category.category_color,
            total: category.total,
            percentage: category.percentage,
          })) ?? []
        );
  }, [analytics?.spendingByCategory, dashboardSummary?.topCategories, totalSpend]);

  const hasRenderableData =
    totalSpend > 0 ||
    dailyTrendData.length > 0 ||
    categoryBreakdownData.length > 0 ||
    hasDetailedData ||
    Boolean(dashboardSummary);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse" />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <CardSkeleton key={i} />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <CardSkeleton className="h-72" />
          <CardSkeleton className="h-72" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <div className="space-y-3 p-6" role="alert" aria-live="assertive">
          <h2 className="text-lg font-semibold text-gray-900">Unable to load analytics</h2>
          <p className="text-sm text-gray-600">
            {error instanceof Error ? error.message : "A network or server error occurred."}
          </p>
          <Button type="button" variant="outline" onClick={() => void refetch()} disabled={isFetching}>
            Retry
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Analytics</h1>
          <p className="text-gray-500 text-sm mt-1">
            Deep dive into your spending patterns
          </p>
        </div>
        <div className="flex w-full flex-wrap items-center gap-2 sm:w-auto sm:flex-nowrap sm:gap-3">
          <ExportButton targetId="analytics-exportable" filename={`finsight-analytics-${selectedMonth || "current"}`} />
          <div className="w-full sm:w-48">
            <Select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              options={[
                { value: "", label: "Current Month" },
                ...monthOptions,
              ]}
            />
          </div>
        </div>
      </div>

      {hasRenderableData ? (
        <div id="analytics-exportable" className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard
              title="Total Spent"
              value={formatCurrency(totalSpend)}
              icon={<TrendingDown size={20} />}
              trend={spendTrend?.direction as any}
              trendValue={spendTrend?.text}
              className="border-l-4 border-l-finance-expense"
            />
            <StatCard
              title="Avg Daily Spend"
              value={formatCurrency(analytics?.avgDailySpend ?? 0)}
              icon={<CalendarDays size={20} />}
              className="border-l-4 border-l-brand-400"
            />
            <StatCard
              title="Savings Rate"
              value={`${analytics?.savingsRate?.toFixed(1) ?? 0}%`}
              icon={<PiggyBank size={20} />}
              trend={savingsTrend?.direction as any}
              trendValue={savingsTrend?.text}
              className="border-l-4 border-l-finance-savings"
            />
            <StatCard
              title="Categories Used"
              value={String(categoryBreakdownData.length)}
              icon={<BarChart3 size={20} />}
              className="border-l-4 border-l-brand-500"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="min-w-0">
              <MonthlyTrendChart data={dailyTrendData} />
            </div>

            <div className="min-w-0">
              <CategoryBreakdown data={categoryBreakdownData} />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6">
            <SpendingHeatmap
              data={analytics?.dailySpending || []}
              monthString={selectedMonth || new Date().toISOString().slice(0, 7)}
            />
          </div>

          {/* Top Categories Table */}
          <Card>
            <CardHeader>
              <h2 className="section-header mb-0">Spending by Category</h2>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="min-w-[520px] w-full text-sm">
                <thead>
                  <tr className="border-b text-left text-gray-500">
                    <th className="px-4 py-3 font-medium">Category</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Amount
                    </th>
                    <th className="px-4 py-3 font-medium text-right">
                      % of Total
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {categoryBreakdownData.map((cat: any) => {
                    const amount = cat.amount ?? cat.total ?? 0;
                    return (
                      <tr key={cat.category ?? cat.name ?? cat.category_name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {cat.category ?? cat.name ?? cat.category_name}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-700">
                          {formatCurrency(amount)}
                        </td>
                        <td className="px-4 py-3 text-right text-gray-500">
                          {calcPercentage(amount, totalSpend || 1).toFixed(1)}%
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </Card>
        </div>
      ) : (
        <Card>
          <div className="p-12 text-center text-gray-400">
            No analytics data available for this period.
          </div>
        </Card>
      )}
    </div>
  );
}
