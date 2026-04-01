"use client";

import { QueryProvider } from "@/hooks/QueryProvider";
import { Toaster } from "react-hot-toast";
import { ThemeModeProvider, useThemeMode } from "@/components/layout/ThemeModeProvider";
import { ThemeModeSwitcher } from "@/components/layout/ThemeModeSwitcher";
import ServiceWorkerRegistrar from "@/components/pwa/ServiceWorkerRegistrar";
import InstallPrompt from "@/components/pwa/InstallPrompt";

function ThemedToaster() {
  const { mode } = useThemeMode();

  const isDark = mode === "dark";

  return (
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 4000,
        style: {
          background: isDark ? "#0f172a" : "#ffffff",
          color: isDark ? "#e2e8f0" : "#1f2937",
          borderRadius: "0.5rem",
          boxShadow:
            "0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)",
        },
        success: { iconTheme: { primary: "#10b981", secondary: "#fff" } },
        error: { iconTheme: { primary: "#ef4444", secondary: "#fff" } },
      }}
    />
  );
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryProvider>
      <ThemeModeProvider>
        <div className="fixed right-3 top-14 z-[80] sm:right-4 sm:top-4">
          <ThemeModeSwitcher />
        </div>
        <ServiceWorkerRegistrar />
        <InstallPrompt />
        {children}
        <ThemedToaster />
      </ThemeModeProvider>
    </QueryProvider>
  );
}

export default AppProviders;
