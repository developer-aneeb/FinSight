"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiDelete, apiGet, apiPost } from "./apiClient";
import type { ApiResponse, Insight, InsightGenerationData } from "@/types";

const INSIGHTS_KEY = "insights";

export function useInsights(limit = 10) {
  return useQuery<ApiResponse<Insight[]>>({
    queryKey: [INSIGHTS_KEY, limit],
    queryFn: () => apiGet("/insights", { limit }),
    staleTime: 120_000,
    gcTime: 600_000,
  });
}

export function useGenerateInsights() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: () => apiPost<InsightGenerationData>("/insights"),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: [INSIGHTS_KEY] });
      await queryClient.refetchQueries({ queryKey: [INSIGHTS_KEY], type: "active" });

      const message = response?.data?.message || "Insights refreshed";
      if (response?.data?.status === "reused_previous") {
        toast(message, { icon: "ℹ️" });
      } else {
        toast.success(message);
      }
    },
    onError: (error: Error) => toast.error(error.message || "Failed to generate insights"),
  });
}

export function useDismissInsight() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/insights/${id}`),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: [INSIGHTS_KEY] });
      await queryClient.refetchQueries({ queryKey: [INSIGHTS_KEY], type: "active" });
    },
    onError: (error: Error) => toast.error(error.message || "Failed to dismiss insight"),
  });
}