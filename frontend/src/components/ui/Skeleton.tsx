/**
 * FinSight — Skeleton Loader
 */
import React from "react";
import { cn } from "@/utils/cn";

interface SkeletonProps {
  className?: string;
  variant?: "text" | "circular" | "rectangular";
  width?: string | number;
  height?: string | number;
}

export function Skeleton({
  className,
  variant = "text",
  width,
  height,
}: SkeletonProps) {
  return (
    <div
      className={cn(
        "animate-pulse bg-gray-200",
        variant === "circular" && "rounded-full",
        variant === "text" && "rounded-md",
        variant === "rectangular" && "rounded-lg",
        className
      )}
      style={{ width, height }}
      aria-hidden="true"
    />
  );
}

export default Skeleton;

/** Pre-built card skeleton */
export function CardSkeleton({ className }: { className?: string }) {
  return (
    <div className={cn("rounded-xl border border-gray-200 bg-white p-5", className)}>
      <Skeleton className="mb-3 h-4 w-1/3" />
      <Skeleton className="mb-2 h-8 w-1/2" />
      <Skeleton className="h-3 w-2/3" />
    </div>
  );
}

/** Transaction list skeleton */
export function TransactionListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 rounded-lg border p-3">
          <Skeleton variant="circular" className="h-10 w-10" />
          <div className="flex-1">
            <Skeleton className="mb-1 h-4 w-40" />
            <Skeleton className="h-3 w-24" />
          </div>
          <Skeleton className="h-5 w-20" />
        </div>
      ))}
    </div>
  );
}
