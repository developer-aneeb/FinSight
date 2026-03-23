/**
 * FinSight — useAlerts Hook
 * Alerts listing & status updates via React Query
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPatch } from "./apiClient";
import toast from "react-hot-toast";
import type { Alert, ApiResponse } from "@/types";

const ALERTS_KEY = "alerts";

export function useAlerts() {
  return useQuery<ApiResponse<Alert[]>>({
    queryKey: [ALERTS_KEY],
    queryFn: () => apiGet("/alerts"),
  });
}

export function useDismissAlert() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiPatch(`/alerts/${id}`, { status: "dismissed" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ALERTS_KEY] });
      toast.success("Alert dismissed");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to dismiss"),
  });
}

export function useMarkAlertRead() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiPatch(`/alerts/${id}`, { status: "read" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [ALERTS_KEY] });
    },
  });
}
