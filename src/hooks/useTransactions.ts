/**
 * FinSight — useTransactions Hook
 * CRUD operations & filtered listing via React Query
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import { useFilterStore } from "@/store/filterStore";
import toast from "react-hot-toast";
import type {
  Transaction,
  PaginatedResponse,
  CreateTransactionInput,
  UpdateTransactionInput,
  ApiResponse,
} from "@/types";

const TRANSACTIONS_KEY = "transactions";

// --------------- List ---------------

export function useTransactions(page = 1, pageSize = 20) {
  const filters = useFilterStore();

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (filters.searchQuery) params.set("search", filters.searchQuery);
  if (filters.selectedType && filters.selectedType !== "all")
    params.set("type", filters.selectedType);
  if (filters.selectedCategoryId)
    params.set("categoryId", filters.selectedCategoryId);
  if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
  if (filters.dateTo) params.set("dateTo", filters.dateTo);
  if (filters.amountMin != null)
    params.set("amountMin", String(filters.amountMin));
  if (filters.amountMax != null)
    params.set("amountMax", String(filters.amountMax));

  return useQuery<PaginatedResponse<Transaction>>({
    queryKey: [TRANSACTIONS_KEY, page, pageSize, { ...filters }],
    queryFn: () => apiGet(`/transactions?${params.toString()}`) as Promise<PaginatedResponse<Transaction>>,
  });
}

// --------------- Single ---------------

export function useTransaction(id: string | undefined) {
  return useQuery<ApiResponse<Transaction>>({
    queryKey: [TRANSACTIONS_KEY, id],
    queryFn: () => apiGet(`/transactions/${id}`),
    enabled: !!id,
  });
}

// --------------- Create ---------------

export function useCreateTransaction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: CreateTransactionInput) =>
      apiPost<Transaction>("/transactions", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Transaction added");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create"),
  });
}

// --------------- Update ---------------

export function useUpdateTransaction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: ({
      id,
      ...data
    }: UpdateTransactionInput & { id: string }) =>
      apiPut<Transaction>(`/transactions/${id}`, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Transaction updated");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to update"),
  });
}

// --------------- Delete ---------------

export function useDeleteTransaction() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/transactions/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TRANSACTIONS_KEY] });
      qc.invalidateQueries({ queryKey: ["analytics"] });
      toast.success("Transaction deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });
}
