/**
 * FinSight — useTransactions Hook
 * CRUD operations & filtered listing via React Query
 */
"use client";

import { useMemo } from "react";
import { keepPreviousData, useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost, apiPut, apiDelete } from "./apiClient";
import { useFilterStore } from "@/store/filterStore";
import { useShallow } from "zustand/react/shallow";
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
  const {
    searchQuery,
    selectedType,
    selectedCategoryId,
    dateFrom,
    dateTo,
    amountMin,
    amountMax,
    tags,
  } = useFilterStore(
    useShallow((state) => ({
      searchQuery: state.searchQuery,
      selectedType: state.selectedType,
      selectedCategoryId: state.selectedCategoryId,
      dateFrom: state.dateFrom,
      dateTo: state.dateTo,
      amountMin: state.amountMin,
      amountMax: state.amountMax,
      tags: state.tags,
    }))
  );

  const tagsKey = useMemo(() => [...tags].sort().join(","), [tags]);

  const queryString = useMemo(() => {
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
    if (tags.length > 0) params.set("tags", tagsKey);

    return params.toString();
  }, [
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
    tagsKey,
  ]);

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
      tagsKey,
    ],
    queryFn: () => apiGet<Transaction[]>(`/transactions?${queryString}`) as Promise<TransactionsListResponse>,
    placeholderData: keepPreviousData,
    staleTime: 30_000,
    gcTime: 300_000,
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
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
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
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
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
      qc.invalidateQueries({ queryKey: ["alerts"] });
      qc.invalidateQueries({ queryKey: ["insights"] });
      toast.success("Transaction deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete"),
  });
}
