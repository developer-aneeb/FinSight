/**
 * FinSight — Category Breakdown Chart
 * Pie/donut chart for expense categories
 */
"use client";

import React from "react";
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
} from "recharts";
import Card, { CardHeader } from "@/components/ui/Card";

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

  const chartData = data.map((d) => ({
    name: `${d.category_icon} ${d.category_name}`,
    value: d.total,
    color: d.category_color,
  }));

  return (
    <Card>
      <CardHeader title="Spending by Category" subtitle="Current month breakdown" />
      <div className="h-72" role="img" aria-label="Category spending pie chart">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={100}
              paddingAngle={2}
              dataKey="value"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => [`PKR ${value.toLocaleString()}`, ""]}
              contentStyle={{
                borderRadius: "8px",
                border: "1px solid #E5E7EB",
              }}
            />
            <Legend
              layout="vertical"
              verticalAlign="middle"
              align="right"
              iconType="circle"
              iconSize={8}
              wrapperStyle={{ fontSize: "12px" }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export default CategoryBreakdown;
