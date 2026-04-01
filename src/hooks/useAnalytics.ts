/**
 * FinSight — useAnalytics Hook
 * Dashboard summary & analytics data via React Query
 */
"use client";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { apiGet } from "./apiClient";
import type { DashboardSummary, AnalyticsData, ApiResponse } from "@/types";

export function useDashboardSummary() {
  return useQuery<ApiResponse<DashboardSummary>>({
    queryKey: ["analytics", "dashboard"],
    queryFn: () => apiGet("/analytics/dashboard"),
    staleTime: 10 * 1000,
  });
}

export function useAnalyticsData(month?: string) {
  return useQuery<ApiResponse<AnalyticsData>>({
    queryKey: ["analytics", "detailed", month],
    queryFn: () => apiGet("/analytics/detailed", month ? { month } : undefined),
    placeholderData: keepPreviousData,
    staleTime: 10 * 1000,
  });
}
