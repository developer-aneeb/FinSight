"use client";

import { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";
import { Navbar } from "@/components/layout/Navbar";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { ROUTES } from "@/utils/constants";
import { apiGet } from "@/hooks/apiClient";
import type { Profile } from "@/types";

export default function AuthenticatedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, isLoading, accessToken, user, setUser, logout } = useAuthStore();
  const [isBootstrappingProfile, setIsBootstrappingProfile] = useState(false);

  useEffect(() => {
    if (isLoading) return;
    if (!accessToken || user) return;

    setIsBootstrappingProfile(true);

    void apiGet<Profile>("/auth/profile")
      .then((profileRes) => {
        if (profileRes.data) {
          setUser(profileRes.data, accessToken);
          return;
        }

        logout();
      })
      .catch(() => {
        logout();
      })
      .finally(() => {
        setIsBootstrappingProfile(false);
      });
  }, [isLoading, accessToken, user, setUser, logout]);

  useEffect(() => {
    // Wait until hydration from localStorage is complete
    if (isLoading || isBootstrappingProfile) return;
    // Redirect to login if not authenticated
    if (!isAuthenticated && !accessToken) {
      router.replace(ROUTES.LOGIN);
      return;
    }

    const onAdminPage = pathname === ROUTES.ADMIN || pathname.startsWith(`${ROUTES.ADMIN}/`);

    if (onAdminPage && user && user.role !== "admin") {
      router.replace(ROUTES.DASHBOARD);
      return;
    }

    if (user?.role === "admin" && !onAdminPage) {
      router.replace(ROUTES.ADMIN);
    }
  }, [isAuthenticated, accessToken, isLoading, isBootstrappingProfile, pathname, user, router]);

  // Show nothing while checking auth state
  if (isLoading || isBootstrappingProfile) {
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

  const onAdminPage = pathname === ROUTES.ADMIN || pathname.startsWith(`${ROUTES.ADMIN}/`);
  if (onAdminPage && user && user.role !== "admin") {
    return null;
  }

  if (user?.role === "admin" && !onAdminPage) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_20%_8%,rgba(110,199,190,0.52),transparent_38%),radial-gradient(circle_at_65%_20%,rgba(44,143,193,0.42),transparent_45%),linear-gradient(130deg,#0b6177_0%,#0d4268_48%,#0a2b4d_100%)] p-1.5 sm:p-2.5">
      <div className="mx-auto flex min-h-[calc(100vh-16px)] w-full max-w-[1440px] gap-1.5">
        <Navbar />
        <div className="flex min-w-0 flex-1 flex-col">
          <main className="flex-1">{children}</main>
          <SiteFooter compact />
        </div>
      </div>
    </div>
  );
}
