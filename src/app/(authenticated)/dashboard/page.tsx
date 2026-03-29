"use client";

import Link from "next/link";
import { useDashboardSummary } from "@/hooks/useAnalytics";
import { useAlerts } from "@/hooks/useAlerts";
import { useDismissInsight, useGenerateInsights, useInsights } from "@/hooks/useInsights";
import { StatCard } from "@/components/dashboard/StatCard";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";
import { CategoryBreakdown } from "@/components/dashboard/CategoryBreakdown";
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
} from "lucide-react";

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary();
  const { data: alertsData } = useAlerts();
  const { data: insightsData } = useInsights(3);
  const generateInsights = useGenerateInsights();
  const dismissInsight = useDismissInsight();

  const summary = data?.data;
  const alerts: Alert[] = alertsData?.data ?? [];
  const insights = insightsData?.data ?? [];
  const unreadAlerts = alerts.filter((a: Alert) => a.status === "unread");

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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
          <p className="text-gray-500 text-sm mt-1">
            Your financial overview at a glance
          </p>
        </div>
        {unreadAlerts.length > 0 && (
          <Link
            href={ROUTES.NOTIFICATIONS}
            className="flex items-center gap-2 bg-amber-50 text-amber-700 px-3 py-2 rounded-lg text-sm font-medium hover:bg-amber-100 transition"
          >
            <Bell size={16} />
            {unreadAlerts.length} new alert{unreadAlerts.length > 1 ? "s" : ""}
          </Link>
        )}
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          title="Total Income"
          value={formatCurrency(summary.totalIncome)}
          icon={<TrendingUp size={20} />}
          trend={summary.totalIncome > 0 ? "up" : undefined}
          trendValue="This month"
          className="border-l-4 border-l-finance-income"
        />
        <StatCard
          title="Total Expenses"
          value={formatCurrency(summary.totalExpenses)}
          icon={<TrendingDown size={20} />}
          trend={summary.totalExpenses > 0 ? "down" : undefined}
          trendValue="This month"
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

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <MonthlyTrendChart data={summary.monthlyTrend ?? []} />
        </div>
        <div>
          <CategoryBreakdown data={summary.topCategories ?? []} />
        </div>
      </div>

      {/* Bottom Row — Budgets & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Active Budgets */}
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

        {/* Recent Transactions */}
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

      {/* Alerts */}
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
          <Button
            size="sm"
            variant="outline"
            isLoading={generateInsights.isPending}
            onClick={() => generateInsights.mutate()}
          >
            Refresh Insights
          </Button>
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
