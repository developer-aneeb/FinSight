/**
 * FinSight — Category Breakdown Chart
 * Pie/donut chart for expense categories
 */
"use client";

import React, { useMemo } from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
} from "recharts";
import Card, { CardHeader } from "@/components/ui/Card";
import { formatCurrency } from "@/utils/formatCurrency";

interface CategoryBreakdownProps {
  data: Array<{
    category_name: string;
    category_icon: string;
    category_color: string;
    total: number;
    percentage: number;
  }>;
}

export function CategoryBreakdown({ data }: CategoryBreakdownProps) {
  const chartData = useMemo(
    () =>
      (data || []).map((d) => ({
        name: d.category_name,
        icon: d.category_icon,
        value: d.total,
        percentage: d.percentage,
        color: d.category_color,
      })),
    [data]
  );

  if (!data || data.length === 0) {
    return (
      <Card>
        <CardHeader title="Spending by Category" />
        <div className="flex h-64 items-center justify-center text-gray-400">
          No spending data yet.
        </div>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader title="Spending by Category" subtitle="Current month breakdown" />
      <div className="h-72" role="img" aria-label="Category spending pie chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="45%"
              innerRadius={58}
              outerRadius={90}
              paddingAngle={2}
              dataKey="value"
              strokeWidth={1}
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [formatCurrency(value), "Amount"]}
              labelFormatter={(_, payload) => {
                const point = payload?.[0]?.payload as { icon?: string; name?: string } | undefined;
                return `${point?.icon || ""} ${point?.name || "Category"}`.trim();
              }}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
              }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
      <div className="px-4 pb-4 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2">
        {chartData.map((entry) => (
          <div key={entry.name} className="flex items-center justify-between text-sm">
            <div className="min-w-0 flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full shrink-0"
                style={{ backgroundColor: entry.color }}
              />
              <span className="truncate text-gray-700">
                {entry.icon} {entry.name}
              </span>
            </div>
            <span className="text-gray-500 ml-2 shrink-0">{entry.percentage.toFixed(0)}%</span>
          </div>
        ))}
      </div>
    </Card>
  );
}

export default CategoryBreakdown;
