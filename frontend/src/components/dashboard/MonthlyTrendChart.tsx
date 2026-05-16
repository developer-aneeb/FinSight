/**
 * FinSight — Monthly Trend Chart
 * Line/bar chart showing income vs expenses over months
 */
"use client";

import React from "react";
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import Card, { CardHeader } from "@/components/ui/Card";

interface MonthlyTrendChartProps {
  data: Array<{
    month: string;
    income: number;
    expenses: number;
  }>;
}

export function MonthlyTrendChart({ data }: MonthlyTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader title="Monthly Trends" subtitle="Income vs Expenses" />
        <div className="flex h-64 items-center justify-center text-gray-400">
          No data available yet.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Monthly Trends" subtitle="Income vs Expenses (last 6 months)" />
      <div className="h-64 min-h-[240px] min-w-0 sm:h-72" role="img" aria-label="Monthly income and expenses bar chart">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 5, right: 10, left: 10, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis dataKey="month" tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <YAxis tick={{ fontSize: 12 }} stroke="#9CA3AF" />
            <Tooltip
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
                boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)",
              }}
              formatter={(value) => {
                const numericValue = typeof value === "number" ? value : Number(value ?? 0);
                return [`PKR ${numericValue.toLocaleString()}`, ""];
              }}
            />
            <Legend />
            <Bar
              dataKey="income"
              name="Income"
              fill="#22C55E"
              radius={[4, 4, 0, 0]}
            />
            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="#EF4444"
              radius={[4, 4, 0, 0]}
            />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default MonthlyTrendChart;
