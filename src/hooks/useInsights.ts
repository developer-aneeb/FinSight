"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiDelete, apiGet, apiPost } from "./apiClient";
import type { ApiResponse, Insight } from "@/types";

const INSIGHTS_KEY = "insights";

export function useInsights(limit = 10) {
  return useQuery<ApiResponse<Insight[]>>({
    queryKey: [INSIGHTS_KEY, limit],
    queryFn: () => apiGet("/insights", { limit }),
  });
}

export function useGenerateInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<Insight[]>("/insights"),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INSIGHTS_KEY] });
      toast.success("Insights refreshed");
    },
    onError: (error: Error) => toast.error(error.message || "Failed to generate insights"),
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/insights/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [INSIGHTS_KEY] });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to dismiss insight"),
  });
}