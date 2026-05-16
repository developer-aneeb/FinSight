/**
 * FinSight — useBudgets Hook
 * Budget CRUD via React Query
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import toast from "react-hot-toast";
import type { Budget, CreateBudgetInput, UpdateBudgetInput, ApiResponse } from "@/types";

const BUDGETS_KEY = "budgets";

export function useBudgets() {
  return useQuery<ApiResponse<Budget[]>>({
    queryKey: [BUDGETS_KEY],
    queryFn: () => apiGet("/budgets"),
  });
}

export function useBudget(id: string | undefined) {
  return useQuery<ApiResponse<Budget>>({
    queryKey: [BUDGETS_KEY, id],
    queryFn: () => apiGet(`/budgets/${id}`),
    enabled: !!id,
  });
}

export function useCreateBudget() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateBudgetInput) =>
      apiPost<Budget>("/budgets", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BUDGETS_KEY] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Budget created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create"),
  });
}

export function useUpdateBudget() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({ id, ...data }: UpdateBudgetInput & { id: string }) =>
      apiPut<Budget>(`/budgets/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BUDGETS_KEY] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Budget updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update"),
  });
}

export function useDeleteBudget() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/budgets/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [BUDGETS_KEY] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Budget deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });
}
