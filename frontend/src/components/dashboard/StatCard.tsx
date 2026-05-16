/**
 * FinSight — Stat Card
 * Shows a key metric with optional trend indicator
 */
"use client";

import React from "react";
import { cn } from "@/utils/cn";
import { TrendingUp, TrendingDown } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  icon?: React.ReactNode;
  trend?: "up" | "down";
  trendValue?: string;
  className?: string;
}

export function StatCard({
  title,
  value,
  icon,
  trend,
  trendValue,
  className,
}: StatCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border bg-white p-5 shadow-sm transition-shadow hover:shadow-md",
        className
      )}
    >
      <div className="flex items-center justify-between">
        <p className="text-sm font-medium text-gray-500">{title}</p>
        {icon && <div className="text-gray-400">{icon}</div>}
      </div>
      <p className="mt-2 text-2xl font-bold text-gray-900">{value}</p>
      {trend && (
        <div
          className={cn(
            "mt-2 flex items-center gap-1 text-sm font-medium",
            trend === "up" ? "text-green-600" : "text-red-600"
          )}
        >
          {trend === "up" ? (
            <TrendingUp className="h-4 w-4" />
          ) : (
            <TrendingDown className="h-4 w-4" />
          )}
          {trendValue && <span>{trendValue}</span>}
        </div>
      )}
    </div>
  );
}

export default StatCard;
