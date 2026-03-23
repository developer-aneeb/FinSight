/**
 * FinSight — useCategories Hook
 * Category & tag listing + creation via React Query
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiGet, apiPost } from "./apiClient";
import toast from "react-hot-toast";
import type { Category, ApiResponse } from "@/types";

const CATEGORIES_KEY = "categories";

// --------------- Categories ---------------

export function useCategories() {
  return useQuery<ApiResponse<Category[]>>({
    queryKey: [CATEGORIES_KEY],
    queryFn: () => apiGet("/categories"),
    staleTime: 5 * 60 * 1000, // categories rarely change
  });
}

export function useCreateCategory() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; icon?: string; color?: string }) =>
      apiPost<Category>("/categories", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [CATEGORIES_KEY] });
      toast.success("Category created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create"),
  });
}

// --------------- Search ---------------

export function useSearch(query: string) {
  return useQuery({
    queryKey: ["search", query],
    queryFn: () =>
      apiGet(`/search?q=${encodeURIComponent(query)}`),
    enabled: query.length >= 2,
    staleTime: 30_000,
  });
}
