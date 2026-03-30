"use client";

import dynamic from "next/dynamic";
import { useMemo, useState } from "react";
import Link from "next/link";
import { useDashboardSummary } from "@/hooks/useAnalytics";
import { useAlerts } from "@/hooks/useAlerts";
import { useDismissInsight, useGenerateInsights, useInsights } from "@/hooks/useInsights";
import { StatCard } from "@/components/dashboard/StatCard";
import { BudgetProgress } from "@/components/budgets/BudgetProgress";
import { TransactionItem } from "@/components/transactions/TransactionItem";
import { AlertItem } from "@/components/alerts/AlertItem";
import { Card, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Skeleton, CardSkeleton } from "@/components/ui/Skeleton";
import { formatCurrency } from "@/utils/formatCurrency";
import { ROUTES } from "@/utils/constants";
import type { Alert } from "@/types";
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  Target,
  ArrowRight,
  Bell,
  Sparkles,
  CalendarRange,
  RefreshCw,
} from "lucide-react";

const MonthlyTrendChart = dynamic(
  () => import("@/components/dashboard/MonthlyTrendChart").then((mod) => mod.MonthlyTrendChart),
  { ssr: false, loading: () => <CardSkeleton className="lg:col-span-2 h-72" /> }
);

const CategoryBreakdown = dynamic(
  () => import("@/components/dashboard/CategoryBreakdown").then((mod) => mod.CategoryBreakdown),
  { ssr: false, loading: () => <CardSkeleton className="h-72" /> }
);

export default function DashboardPage() {
  const { data, isLoading, error, refetch, isRefetching } = useDashboardSummary();
  const { data: alertsData } = useAlerts();
  const { data: insightsData } = useInsights(3);
  const generateInsights = useGenerateInsights();
  const dismissInsight = useDismissInsight();
  const [trendRange, setTrendRange] = useState<"week" | "month" | "year">("month");

  const summary = data?.data;
  const alerts: Alert[] = alertsData?.data ?? [];
  const insights = insightsData?.data ?? [];
  const unreadAlerts = alerts.filter((a: Alert) => a.status === "unread");
  const trendCards = summary?.highLevelTrends;

  const trendChartData = useMemo(() => {
    const trend = summary?.monthlyTrend ?? [];
    if (trendRange === "year") {
      return trend.slice(-12);
    }

    if (trendRange === "month") {
      return trend.slice(-6);
    }

    return trend.slice(-3);
  }, [summary?.monthlyTrend, trendRange]);

  if (isLoading) return <DashboardSkeleton />;

  if (error) {
    return (
      <div className="text-center py-12">
        <p className="text-red-500">Failed to load dashboard. Please try again.</p>
      </div>
    );
  }

  if (!summary) return null;

  return (
    <div className="space-y-6">
      <div className="rounded-2xl border border-brand-100 bg-gradient-to-r from-brand-50 via-white to-white p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
        <div>
            <h1 className="text-2xl font-bold text-gray-900">Financial Dashboard</h1>
            <p className="text-gray-600 text-sm mt-1">
              Real-time snapshot of your cashflow, balance, and spending patterns.
          </p>
        </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              isLoading={isRefetching}
              onClick={() => void refetch()}
            >
              Refresh
            </Button>
            <Button
              size="sm"
              variant="primary"
              leftIcon={<Sparkles size={14} />}
              isLoading={generateInsights.isPending}
              onClick={() => generateInsights.mutate()}
            >
              Generate Insights
            </Button>
            {unreadAlerts.length > 0 && (
              <Link
                href={ROUTES.NOTIFICATIONS}
                className="inline-flex items-center gap-2 rounded-lg bg-amber-50 px-3 py-2 text-sm font-medium text-amber-700 hover:bg-amber-100"
              >
                <Bell size={16} />
                {unreadAlerts.length} new alert{unreadAlerts.length > 1 ? "s" : ""}
              </Link>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(summary.totalIncome)}
          icon={<TrendingUp size={20} />}
          trend={summary.totalIncome > 0 ? "up" : undefined}
          trendValue="Current month"
          className="border-l-4 border-l-finance-income"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
          icon={<TrendingDown size={20} />}
          trend={summary.totalExpenses > 0 ? "down" : undefined}
          trendValue="Current month"
          className="border-l-4 border-l-finance-expense"
        />
        <StatCard
          title="Net Balance"
          value={formatCurrency(summary.totalIncome - summary.totalExpenses)}
          icon={<Wallet size={20} />}
          trend={
            summary.totalIncome - summary.totalExpenses >= 0 ? "up" : "down"
          }
          trendValue="Income − Expenses"
          className="border-l-4 border-l-finance-savings"
        />
        <StatCard
          title="Active Budgets"
          value={String(summary.activeBudgets?.length ?? 0)}
          icon={<Target size={20} />}
          trendValue="Currently tracked"
          className="border-l-4 border-l-brand-500"
        />
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="section-header mb-0">High-Level Trends</h2>
            <p className="text-sm text-gray-500 mt-1">Compare weekly, monthly, and yearly performance.</p>
          </div>
          <div className="inline-flex items-center gap-1 rounded-lg border border-gray-200 p-1">
            {["week", "month", "year"].map((range) => (
              <button
                key={range}
                className={`rounded-md px-3 py-1.5 text-xs font-medium capitalize transition ${
                  trendRange === range
                    ? "bg-brand-600 text-white"
                    : "text-gray-600 hover:bg-gray-100"
                }`}
                onClick={() => setTrendRange(range as "week" | "month" | "year")}
              >
                {range}
              </button>
            ))}
          </div>
        </CardHeader>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500 flex items-center gap-1"><CalendarRange size={12} /> Income</p>
            <p className="mt-1 text-lg font-semibold text-finance-income">
              {formatCurrency(trendCards?.[trendRange].income ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Expenses</p>
            <p className="mt-1 text-lg font-semibold text-finance-expense">
              {formatCurrency(trendCards?.[trendRange].expenses ?? 0)}
            </p>
          </div>
          <div className="rounded-lg border border-gray-200 p-4">
            <p className="text-xs text-gray-500">Net</p>
            <p className={`mt-1 text-lg font-semibold ${(trendCards?.[trendRange].net ?? 0) >= 0 ? "text-finance-savings" : "text-finance-expense"}`}>
              {formatCurrency(trendCards?.[trendRange].net ?? 0)}
            </p>
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyTrendChart data={trendChartData} />
        </div>
        <div>
          <CategoryBreakdown data={summary.topCategories ?? []} />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="section-header mb-0">Budget Progress</h2>
            <Link
              href={ROUTES.BUDGETS}
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <div className="p-4 pt-0 space-y-4">
            {summary.activeBudgets && summary.activeBudgets.length > 0 ? (
              summary.activeBudgets
                .slice(0, 4)
                .map((b: any) => <BudgetProgress key={b.id} budget={b} />)
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                No active budgets
              </p>
            )}
          </div>
        </Card>

        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="section-header mb-0">Recent Transactions</h2>
            <Link
              href={ROUTES.TRANSACTIONS}
              className="text-sm text-brand-600 hover:text-brand-700 flex items-center gap-1"
            >
              View all <ArrowRight size={14} />
            </Link>
          </CardHeader>
          <div className="p-4 pt-0 divide-y">
            {summary.recentTransactions &&
            summary.recentTransactions.length > 0 ? (
              summary.recentTransactions
                .slice(0, 5)
                .map((t: any) => <TransactionItem key={t.id} transaction={t} />)
            ) : (
              <p className="text-gray-400 text-sm text-center py-4">
                No recent transactions
              </p>
            )}
          </div>
        </Card>
      </div>

      {unreadAlerts.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="section-header mb-0">Alerts</h2>
          </CardHeader>
          <div className="p-4 pt-0 space-y-3">
            {unreadAlerts.slice(0, 3).map((alert) => (
              <AlertItem key={alert.id} alert={alert} />
            ))}
          </div>
        </Card>
      )}

      <Card>
        <CardHeader className="flex items-center justify-between">
          <h2 className="section-header mb-0">AI Insights</h2>
          <span className="text-xs text-gray-500">Personalized recommendations</span>
        </CardHeader>
        <div className="p-4 pt-0 space-y-3">
          {insights.length === 0 ? (
            <p className="text-gray-500 text-sm">No insights yet. Click Refresh Insights to generate recommendations.</p>
          ) : (
            insights.map((insight) => (
              <div key={insight.id} className="rounded-lg border border-gray-200 p-3">
                <div className="flex items-center justify-between gap-3">
                  <p className="font-semibold text-gray-900 text-sm">{insight.title}</p>
                  <button
                    className="text-xs text-gray-500 hover:text-gray-700"
                    onClick={() => dismissInsight.mutate(insight.id)}
                  >
                    Dismiss
                  </button>
                </div>
                <p className="mt-1 text-sm text-gray-700">{insight.body}</p>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-8 w-40" />
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <CardSkeleton className="lg:col-span-2 h-72" />
        <CardSkeleton className="h-72" />
      </div>
    </div>
  );
}
