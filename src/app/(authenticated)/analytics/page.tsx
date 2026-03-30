"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import { useAnalyticsData } from "@/hooks/useAnalytics";
import { StatCard } from "@/components/dashboard/StatCard";
import { Card, CardHeader } from "@/components/ui/Card";
import { Select } from "@/components/ui/Select";
import { CardSkeleton } from "@/components/ui/Skeleton";
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
  const { data, isLoading } = useAnalyticsData(selectedMonth || undefined);

  const analytics = data?.data;

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
    () =>
      Array.from({ length: 6 }).map((_, i) => {
        const d = new Date();
        d.setMonth(d.getMonth() - i);
        const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
        const label = d.toLocaleDateString("en-PK", {
          year: "numeric",
          month: "long",
        });
        return { value, label };
      }),
    []
  );

  const totalSpend = useMemo(
    () =>
      analytics?.spendingByCategory?.reduce(
        (sum: number, c: any) => sum + (c.amount ?? c.total ?? 0),
        0
      ) ?? 0,
    [analytics?.spendingByCategory]
  );

  const dailyTrendData = useMemo(
    () =>
      analytics?.dailySpending?.map((d: any) => ({
        month: d.date,
        income: 0,
        expenses: d.amount ?? d.total ?? 0,
      })) ?? [],
    [analytics?.dailySpending]
  );

  const categoryBreakdownData = useMemo(
    () =>
      (analytics?.spendingByCategory ?? []).map((c: any) => ({
        category_name: c.category ?? c.name ?? "",
        category_icon: c.icon ?? "📁",
        category_color: c.color ?? "#6B7280",
        total: c.amount ?? c.total ?? 0,
        percentage: totalSpend > 0 ? calcPercentage(c.amount ?? c.total ?? 0, totalSpend) : 0,
      })),
    [analytics?.spendingByCategory, totalSpend]
  );

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
        <div className="flex items-center gap-3">
          <ExportButton targetId="analytics-exportable" filename={`finsight-analytics-${selectedMonth || "current"}`} />
          <div className="w-48">
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

      {analytics ? (
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
              value={formatCurrency(analytics.avgDailySpend ?? 0)}
              icon={<CalendarDays size={20} />}
              className="border-l-4 border-l-brand-400"
            />
            <StatCard
              title="Savings Rate"
              value={`${analytics.savingsRate?.toFixed(1) ?? 0}%`}
              icon={<PiggyBank size={20} />}
              trend={savingsTrend?.direction as any}
              trendValue={savingsTrend?.text}
              className="border-l-4 border-l-finance-savings"
            />
            <StatCard
              title="Categories Used"
              value={String(analytics.spendingByCategory?.length ?? 0)}
              icon={<BarChart3 size={20} />}
              className="border-l-4 border-l-brand-500"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MonthlyTrendChart data={dailyTrendData} />

            <CategoryBreakdown data={categoryBreakdownData} />
          </div>

          <div className="grid grid-cols-1 gap-6">
            <SpendingHeatmap
              data={analytics.dailySpending || []}
              monthString={selectedMonth || new Date().toISOString().slice(0, 7)}
            />
          </div>

          {/* Top Categories Table */}
          <Card>
            <CardHeader>
              <h2 className="section-header mb-0">Spending by Category</h2>
            </CardHeader>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
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
                  {analytics.spendingByCategory?.map((cat: any) => {
                    const amount = cat.amount ?? cat.total ?? 0;
                    return (
                      <tr key={cat.category ?? cat.name} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-900">
                          {cat.category ?? cat.name}
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
