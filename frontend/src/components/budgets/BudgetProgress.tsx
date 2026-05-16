/**
 * FinSight — Budget Progress Card
 * Displays budget usage with progress bar
 */
"use client";

import React from "react";
import { cn } from "@/utils/cn";
import { formatCurrency } from "@/utils/formatCurrency";
import Card from "@/components/ui/Card";
import { BUDGET_THRESHOLDS } from "@/utils/constants";
import type { Budget } from "@/types";

interface BudgetProgressProps {
  budget: Budget & { usage_percentage?: number };
}

export function BudgetProgress({ budget }: BudgetProgressProps) {
  const usage = budget.amount_limit > 0
    ? budget.spent / budget.amount_limit
    : 0;
  const percentage = Math.min(Math.round(usage * 100), 100);

  const barColor =
    usage >= BUDGET_THRESHOLDS.EXCEEDED
      ? "bg-red-500"
      : usage >= BUDGET_THRESHOLDS.DANGER
        ? "bg-orange-500"
        : usage >= BUDGET_THRESHOLDS.WARNING
          ? "bg-amber-500"
          : "bg-green-500";

  const statusText =
    usage >= BUDGET_THRESHOLDS.EXCEEDED
      ? "Exceeded!"
      : usage >= BUDGET_THRESHOLDS.DANGER
        ? "Almost there"
        : usage >= BUDGET_THRESHOLDS.WARNING
          ? "On track"
          : "Good";

  return (
    <Card padding="sm" hoverable>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="text-lg">{budget.category?.icon || "📋"}</span>
          <div>
            <p className="text-sm font-medium text-gray-900">{budget.name}</p>
            <p className="text-xs text-gray-500">{budget.period}</p>
          </div>
        </div>
        <span
          className={cn(
            "text-xs font-medium",
            usage >= BUDGET_THRESHOLDS.DANGER ? "text-red-600" : "text-gray-500"
          )}
        >
          {statusText}
        </span>
      </div>

      {/* Progress bar */}
      <div className="mt-3">
        <div className="mb-1 flex justify-between text-xs text-gray-500">
          <span>{formatCurrency(budget.spent)} spent</span>
          <span>{formatCurrency(budget.amount_limit)} limit</span>
        </div>
        <div
          className="h-2 w-full overflow-hidden rounded-full bg-gray-100"
          role="progressbar"
          aria-valuenow={percentage}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-label={`${budget.name} budget: ${percentage}% used`}
        >
          <div
            className={cn("h-full rounded-full transition-all duration-500", barColor)}
            style={{ width: `${Math.min(percentage, 100)}%` }}
          />
        </div>
        <p className="mt-1 text-right text-xs font-medium text-gray-600">
          {percentage}%
        </p>
      </div>
    </Card>
  );
}

export default BudgetProgress;
