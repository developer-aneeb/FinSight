"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ROUTES } from "@/utils/constants";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const { isAuthenticated, isLoading, accessToken } = useAuthStore();

  useEffect(() => {
    // Wait until hydration from localStorage is complete
    if (isLoading) return;
    // Redirect to login if not authenticated
    if (!isAuthenticated && !accessToken) {
      router.replace(ROUTES.LOGIN);
    }
  }, [isAuthenticated, accessToken, isLoading, router]);

  // Show nothing while checking auth state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-brand-600 border-t-transparent" />
      </div>
    );
  }

  // Don't render protected content if not authenticated
  if (!isAuthenticated && !accessToken) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <Navbar />
      <main className="page-container flex-1">{children}</main>
      <SiteFooter compact />
    </div>
  );
}
