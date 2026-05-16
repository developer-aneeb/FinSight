"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { apiGet, apiPost } from "./apiClient";
import type { ApiResponse } from "@/types";

const PIPELINE_HISTORY_KEY = "analysis-pipeline-history";

export type AnalysisPipelineRequest = {
  lookbackDays: number;
  minCategorySharePct: number;
  minRecurringCount: number;
  maxSuggestions: number;
  commitInsights: boolean;
};

export type AnalysisPipelineResponse = {
  runAt: string;
  lookbackDays: number;
  stats: {
    transactionsScanned: number;
    expensesScanned: number;
    totalExpense: number;
    normalizedDescriptions: number;
    uniqueNormalizedDescriptions: number;
    categoriesFound: number;
  };
  patterns: {
    topCategories: Array<{ category: string; amount: number; sharePct: number }>;
    recurringMerchants: Array<{ merchant: string; count: number; total: number }>;
    weekdaySpend: Record<string, number>;
  };
  recommendations: Array<{
    title: string;
    body: string;
    insightType: string;
    score: number;
    metadata: Record<string, unknown>;
  }>;
  persistedInsights: number;
  mode: "dry-run" | "commit";
};

export type AnalysisPipelineRunHistory = {
  id: string;
  status: "success" | "failed";
  mode: "dry-run" | "commit";
  lookback_days: number;
  recommendations_count: number;
  persisted_insights: number;
  error_message: string | null;
  started_at: string;
  finished_at: string;
};

export function useAnalysisPipelineHistory(limit = 10) {
  return useQuery<ApiResponse<AnalysisPipelineRunHistory[]>>({
    queryKey: [PIPELINE_HISTORY_KEY, limit],
    queryFn: () => apiGet("/pipelines/analysis", { limit }),
    staleTime: 30_000,
  });
}

export function useRunAnalysisPipeline() {
  const queryClient = useQueryClient();

  return useMutation<ApiResponse<AnalysisPipelineResponse>, Error, AnalysisPipelineRequest>({
    mutationFn: (payload) => apiPost<AnalysisPipelineResponse>("/pipelines/analysis", payload),
    onSuccess: async (response) => {
      await queryClient.invalidateQueries({ queryKey: [PIPELINE_HISTORY_KEY] });
      if (response.data?.mode === "commit") {
        toast.success(`Pipeline completed. ${response.data.persistedInsights} insight(s) saved.`);
      } else {
        toast.success("Pipeline dry-run completed successfully.");
      }
    },
    onError: async (error) => {
      await queryClient.invalidateQueries({ queryKey: [PIPELINE_HISTORY_KEY] });
      toast.error(error.message || "Failed to run analysis pipeline.");
    },
  });
}
