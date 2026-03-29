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
  CreateTransactionInput,
  UpdateTransactionInput,
  ApiResponse,
} from "@/types";

const TRANSACTIONS_KEY = "transactions";
type TransactionsListResponse = ApiResponse<Transaction[]> & {
  pagination: {
    total: number;
    page: number;
    pageSize: number;
    totalPages: number;
  };
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

// --------------- List ---------------

export function useTransactions(page = 1, pageSize = 20) {
  const searchQuery = useFilterStore((state) => state.searchQuery);
  const selectedType = useFilterStore((state) => state.selectedType);
  const selectedCategoryId = useFilterStore((state) => state.selectedCategoryId);
  const dateFrom = useFilterStore((state) => state.dateFrom);
  const dateTo = useFilterStore((state) => state.dateTo);
  const amountMin = useFilterStore((state) => state.amountMin);
  const amountMax = useFilterStore((state) => state.amountMax);
  const tags = useFilterStore((state) => state.tags);

  const params = new URLSearchParams();
  params.set("page", String(page));
  params.set("pageSize", String(pageSize));
  if (searchQuery) params.set("search", searchQuery);
  if (selectedType && selectedType !== "all") params.set("type", selectedType);
  if (selectedCategoryId) params.set("categoryId", selectedCategoryId);
  if (dateFrom) params.set("dateFrom", dateFrom);
  if (dateTo) params.set("dateTo", dateTo);
  if (amountMin != null) params.set("amountMin", String(amountMin));
  if (amountMax != null) params.set("amountMax", String(amountMax));
  if (tags.length > 0) params.set("tags", tags.join(","));

  return useQuery<TransactionsListResponse>({
    queryKey: [
      TRANSACTIONS_KEY,
      page,
      pageSize,
      searchQuery,
      selectedType,
      selectedCategoryId,
      dateFrom,
      dateTo,
      amountMin,
      amountMax,
      tags,
    ],
    queryFn: () => apiGet<Transaction[]>(`/transactions?${params.toString()}`) as Promise<TransactionsListResponse>,
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
