/**
 * FinSight — Alert Item Component
 */
"use client";

import React from "react";
import { cn } from "@/utils/cn";
import { ALERT_SEVERITY_COLORS } from "@/utils/constants";
import { formatRelativeDate } from "@/utils/dateHelpers";
import { AlertTriangle, Info, AlertCircle, X } from "lucide-react";
import type { Alert } from "@/types";

interface AlertItemProps {
  alert: Alert;
  onDismiss?: (id: string) => void;
}

const severityIcons = {
  info: Info,
  warning: AlertTriangle,
  critical: AlertCircle,
} as const;

export function AlertItem({ alert, onDismiss }: AlertItemProps) {
  const Icon = severityIcons[alert.severity as keyof typeof severityIcons] ?? Info;
  const severityClass = ALERT_SEVERITY_COLORS[alert.severity] ?? ALERT_SEVERITY_COLORS.info;

  return (
    <div
      className={cn(
        "flex items-start gap-3 rounded-lg border p-3",
        severityClass
      )}
      role="alert"
    >
      <Icon className="mt-0.5 h-5 w-5 flex-shrink-0" />
      <div className="min-w-0 flex-1">
        <p className="text-sm font-medium">{alert.title}</p>
        <p className="mt-0.5 text-sm opacity-80">{alert.message}</p>
        <p className="mt-1 text-xs opacity-60">
          {formatRelativeDate(alert.created_at)}
        </p>
      </div>
      {onDismiss && alert.status !== "dismissed" && (
        <button
          onClick={() => onDismiss(alert.id)}
          className="flex-shrink-0 rounded p-1 opacity-60 hover:opacity-100"
          aria-label="Dismiss alert"
        >
          <X className="h-4 w-4" />
        </button>
      )}
    </div>
  );
}

export default AlertItem;
