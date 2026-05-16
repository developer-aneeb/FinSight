"use client";

import { useEffect } from "react";

export default function ServiceWorkerRegistrar() {
  useEffect(() => {
    if (typeof window === "undefined") return;

    if ('serviceWorker' in navigator) {
      const register = async () => {
        try {
          const reg = await navigator.serviceWorker.register('/sw.js');
          // eslint-disable-next-line no-console
          console.log('ServiceWorker registered', reg.scope);
        } catch (err) {
          // eslint-disable-next-line no-console
          console.warn('ServiceWorker registration failed', err);
        }
      };

      // register after a short delay so first paint is not blocked
      const t = setTimeout(register, 1000);
      return () => clearTimeout(t);
    }
  }, []);

  return null;
}
