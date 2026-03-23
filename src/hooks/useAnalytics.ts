/**
 * FinSight — useAnalytics Hook
 * Dashboard summary & analytics data via React Query
 */
"use client";

import { useQuery } from "@tanstack/react-query";
import { apiGet } from "./apiClient";
import type { DashboardSummary, AnalyticsData, ApiResponse } from "@/types";

export function useDashboardSummary() {
  return useQuery<ApiResponse<DashboardSummary>>({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => apiGet("/analytics/dashboard"),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

export function useAnalyticsData(month?: string) {
  const params = new URLSearchParams();
  if (month) params.set("month", month);

  return useQuery<ApiResponse<AnalyticsData>>({
    queryKey: ["analytics", "detailed", month],
    queryFn: () => apiGet(`/analytics/detailed?${params.toString()}`),
    staleTime: 2 * 60 * 1000,
  });
}
