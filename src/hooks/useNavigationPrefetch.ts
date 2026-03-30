"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import { apiGet } from "./apiClient";
import { ROUTES } from "@/utils/constants";

const DEFAULT_TRANSACTIONS_QUERY_KEY = [
  "transactions",
  1,
  20,
  "",
  "all",
  null,
  "",
  "",
  null,
  null,
  "",
] as const;

export function useNavigationPrefetch() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());

  const prefetchRoute = useCallback(
    (href: string) => {
      if (prefetchedRoutesRef.current.has(href)) {
        return;
      }

      prefetchedRoutesRef.current.add(href);
      router.prefetch(href);

      if (href === ROUTES.DASHBOARD) {
        void Promise.all([
          queryClient.prefetchQuery({
            queryKey: ["analytics", "dashboard"],
            queryFn: () => apiGet("/analytics/dashboard"),
            staleTime: 120_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ["alerts"],
            queryFn: () => apiGet("/alerts"),
            staleTime: 20_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ["insights", 3],
            queryFn: () => apiGet("/insights", { limit: 3 }),
            staleTime: 120_000,
          }),
        ]);
        return;
      }

      if (href === ROUTES.ANALYTICS) {
        void Promise.all([
          queryClient.prefetchQuery({
            queryKey: ["analytics", "dashboard"],
            queryFn: () => apiGet("/analytics/dashboard"),
            staleTime: 120_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ["analytics", "detailed", undefined],
            queryFn: () => apiGet("/analytics/detailed"),
            staleTime: 120_000,
          }),
        ]);
        return;
      }

      if (href === ROUTES.INSIGHTS || href === ROUTES.INSIGHTS_PIPELINE) {
        void queryClient.prefetchQuery({
          queryKey: ["insights", 20],
          queryFn: () => apiGet("/insights", { limit: 20 }),
          staleTime: 120_000,
        });
        return;
      }

      if (href === ROUTES.NOTIFICATIONS || href === ROUTES.ADMIN_NOTIFICATIONS) {
        void queryClient.prefetchQuery({
          queryKey: ["alerts"],
          queryFn: () => apiGet("/alerts"),
          staleTime: 20_000,
        });
        return;
      }

      if (href === ROUTES.BUDGETS) {
        void Promise.all([
          queryClient.prefetchQuery({
            queryKey: ["budgets"],
            queryFn: () => apiGet("/budgets"),
            staleTime: 60_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ["categories"],
            queryFn: () => apiGet("/categories"),
            staleTime: 300_000,
          }),
        ]);
        return;
      }

      if (href === ROUTES.CATEGORIES) {
        void Promise.all([
          queryClient.prefetchQuery({
            queryKey: ["categories"],
            queryFn: () => apiGet("/categories"),
            staleTime: 300_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ["tags"],
            queryFn: () => apiGet("/tags"),
            staleTime: 300_000,
          }),
        ]);
        return;
      }

      if (href === ROUTES.TRANSACTIONS) {
        void Promise.all([
          queryClient.prefetchQuery({
            queryKey: DEFAULT_TRANSACTIONS_QUERY_KEY,
            queryFn: () => apiGet("/transactions", { page: 1, pageSize: 20 }),
            staleTime: 30_000,
          }),
          queryClient.prefetchQuery({
            queryKey: ["categories"],
            queryFn: () => apiGet("/categories"),
            staleTime: 300_000,
          }),
        ]);
      }
    },
    [queryClient, router]
  );

  return { prefetchRoute };
}
