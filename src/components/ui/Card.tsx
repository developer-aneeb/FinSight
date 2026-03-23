/**
 * FinSight — Card Component
 */
"use client";

import React from "react";
import { cn } from "@/utils/cn";

interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: "sm" | "md" | "lg";
  hoverable?: boolean;
}

export function Card({
  children,
  className,
  padding = "md",
  hoverable = false,
}: CardProps) {
  const paddings = { sm: "p-3", md: "p-5", lg: "p-6" };

  return (
    <div
      className={cn(
        "rounded-xl border border-gray-200 bg-white shadow-sm",
        paddings[padding],
        hoverable && "transition-shadow hover:shadow-md",
        className
      )}
    >
      {children}
    </div>
  );
}

export default Card;

/** Card header */
export function CardHeader({
  title,
  subtitle,
  action,
  className,
  children,
}: {
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("mb-4 flex items-center justify-between", className)}>
      {children ? (
        children
      ) : (
        <>
          <div>
            {title && <h3 className="text-lg font-semibold text-gray-900">{title}</h3>}
            {subtitle && (
              <p className="mt-0.5 text-sm text-gray-500">{subtitle}</p>
            )}
          </div>
          {action}
        </>
      )}
    </div>
  );
}
