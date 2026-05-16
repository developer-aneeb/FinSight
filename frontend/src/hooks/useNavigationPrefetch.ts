"use client";

import { useCallback, useRef } from "react";
import { useRouter } from "next/navigation";

export function useNavigationPrefetch() {
  const router = useRouter();
  const prefetchedRoutesRef = useRef<Set<string>>(new Set());

  const prefetchRoute = useCallback(
    (href: string) => {
      if (prefetchedRoutesRef.current.has(href)) {
        return;
      }

      prefetchedRoutesRef.current.add(href);
      router.prefetch(href);
    },
    [router]
  );

  return { prefetchRoute };
}
