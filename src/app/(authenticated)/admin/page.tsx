"use client";

import { useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiGet, apiPost } from "@/hooks/apiClient";
import { Card, CardHeader } from "@/components/ui/Card";
import { CardSkeleton } from "@/components/ui/Skeleton";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { MonthlyTrendChart } from "@/components/dashboard/MonthlyTrendChart";   
import { AdminSubnav } from "@/components/admin/AdminSubnav";
import { formatCurrency } from "@/utils/formatCurrency";
import { ShieldCheck, Users, ArrowLeftRight, PiggyBank, BellRing, Activity, BrainCircuit } from "lucide-react";
import toast from "react-hot-toast";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import type { ApiResponse } from "@/types";

interface AdminDashboardStats {
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

const roleColors: Record<string, string> = {
  admin: "#6366F1",
  user: "#14B8A6",
};

const severityColors: Record<string, string> = {
  info: "#3B82F6",
  warning: "#F59E0B",
  critical: "#EF4444",
};

export default function AdminPage() {
  const { data: statsResponse, isLoading, error } = useQuery<ApiResponse<AdminDashboardStats>>({
    queryKey: ["admin", "dashboard"],
    queryFn: () => apiGet("/admin/dashboard"),
  });

  const stats = statsResponse?.data;

  const roleChartData = useMemo(
    () =>
      (stats?.roleDistribution ?? []).map((entry) => ({
        name: entry.role === "admin" ? "Admins" : "Users",
        value: entry.count,
        color: roleColors[entry.role] || "#6B7280",
      })),
    [stats?.roleDistribution]
  );

  const alertsChartData = useMemo(
    () =>
      (stats?.alertsBySeverity ?? []).map((entry) => ({
        severity: entry.severity,
        total: entry.total,
        unread: entry.unread,
        color: severityColors[entry.severity] || "#6B7280",
      })),
    [stats?.alertsBySeverity]
  );

  const pipelineMutation = useMutation({
    mutationFn: () => apiPost("/admin/pipelines", {}),
    onSuccess: (res: any) => {
      toast.success(res.message || "Pipeline triggered successfully");
    },
    onError: (err: any) => {
      toast.error(err.message || "Failed to trigger pipeline");
    },
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="space-y-3">
          <div className="h-8 w-52 bg-gray-200 rounded animate-pulse" />
          <div className="h-10 w-full max-w-md bg-gray-200 rounded animate-pulse" />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
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
    <div className="space-y-6 max-w-6xl mx-auto">
      <div className="space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <ShieldCheck size={24} className="text-brand-600" />
            <h1 className="text-2xl font-bold text-gray-900">Admin Analytics</h1> 
          </div>
          <Button 
            onClick={() => pipelineMutation.mutate()} 
            disabled={pipelineMutation.isPending}
            className="flex items-center gap-2"
          >
            <BrainCircuit size={16} />
            {pipelineMutation.isPending ? "Running Pipeline..." : "Run AI Analysis Pipeline"}
          </Button>
        </div>
        <AdminSubnav />
      </div>

      {error && (
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Activity size={18} className="text-red-500" />
            <h2 className="font-semibold text-red-600">Unable to load admin analytics</h2>
          </CardHeader>
        </Card>
      )}

      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex items-center gap-2">
            <Users size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Total Users</h2>
          </CardHeader>
          <div className="px-4 pb-4 text-2xl font-bold text-gray-900">{stats?.totalUsers ?? 0}</div>
          <div className="px-4 pb-4 pt-0 text-xs text-gray-500">
            <span>Admins: {stats?.totalAdmins ?? 0}</span> • <span>Users: {stats?.totalStandardUsers ?? 0}</span>
          </div>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <ArrowLeftRight size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Transactions</h2>
          </CardHeader>
          <div className="px-4 pb-4 text-2xl font-bold text-gray-900">{stats?.totalTransactions ?? 0}</div>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <PiggyBank size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Budgets</h2>
          </CardHeader>
          <div className="px-4 pb-4 text-2xl font-bold text-gray-900">{stats?.totalBudgets ?? 0}</div>
        </Card>

        <Card>
          <CardHeader className="flex items-center gap-2">
            <BellRing size={18} className="text-gray-500" />
            <h2 className="font-semibold text-gray-900">Unread Alerts</h2>
          </CardHeader>
          <div className="px-4 pb-2 text-2xl font-bold text-gray-900">{stats?.totalUnreadAlerts ?? 0}</div>
          <div className="px-4 pb-4 pt-0">
            <Badge variant="danger">Critical: {stats?.criticalUnreadAlerts ?? 0}</Badge>
          </div>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Platform Income</h2>
          </CardHeader>
          <div className="px-4 pb-4 text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalIncome ?? 0)}</div>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Platform Expenses</h2>
          </CardHeader>
          <div className="px-4 pb-4 text-2xl font-bold text-gray-900">{formatCurrency(stats?.totalExpenses ?? 0)}</div>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="font-semibold text-gray-900">Net Balance</h2>
          </CardHeader>
          <div className="px-4 pb-4 text-2xl font-bold text-gray-900">{formatCurrency(stats?.netBalance ?? 0)}</div>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <MonthlyTrendChart data={stats?.monthlyTrend ?? []} />

        <Card>
          <CardHeader title="Role Distribution" subtitle="Admin vs standard users" />
          <div className="h-72" role="img" aria-label="Role distribution pie chart">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={roleChartData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  paddingAngle={2}
                >
                  {roleChartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      </div>

      <Card>
        <CardHeader title="Alerts Severity" subtitle="Total and unread by severity" />
        <div className="h-80" role="img" aria-label="Alerts severity bar chart">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={alertsChartData} margin={{ top: 5, right: 12, left: 0, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis dataKey="severity" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
              <Tooltip />
              <Bar dataKey="total" name="Total" fill="#94A3B8" radius={[4, 4, 0, 0]} />
              <Bar dataKey="unread" name="Unread" fill="#EF4444" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </Card>
    </div>
  );
}
