/**
 * FinSight — useCategories Hook
 * Category & tag listing + creation via React Query
 */
"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiDelete, apiGet, apiPost } from "./apiClient";
import toast from "react-hot-toast";
import type { Category, ApiResponse, Tag } from "@/types";

const CATEGORIES_KEY = "categories";
const TAGS_KEY = "tags";

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

export function useTags() {
  return useQuery<ApiResponse<Tag[]>>({
    queryKey: [TAGS_KEY],
    queryFn: () => apiGet("/tags"),
    staleTime: 5 * 60 * 1000,
  });
}

export function useCreateTag() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (input: { name: string; color?: string }) =>
      apiPost<Tag>("/tags", input),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TAGS_KEY] });
      toast.success("Tag created");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to create tag"),
  });
}

export function useDeleteTag() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => apiDelete(`/tags/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: [TAGS_KEY] });
      toast.success("Tag deleted");
    },
    onError: (err: Error) => toast.error(err.message || "Failed to delete tag"),
  });
}
