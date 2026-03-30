/**
 * FinSight — Navigation Bar
 */
"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/utils/cn";
import { useAuthStore } from "@/store/authStore";
import { useAuth } from "@/hooks/useAuth";
import { useNavigationPrefetch } from "@/hooks/useNavigationPrefetch";
import { ROUTES } from "@/utils/constants";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  PiggyBank,
  FolderOpen,
  BarChart3,
  BellRing,
  ShieldCheck,
  Bell,
  LogOut,
  Menu,
  X,
  Sparkles,
  UserCircle,
} from "lucide-react";

const baseNavItems = [
  { label: "Home", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Transactions", href: ROUTES.TRANSACTIONS, icon: ArrowLeftRight },
  { label: "Budgets", href: ROUTES.BUDGETS, icon: PiggyBank },
  { label: "Categories", href: ROUTES.CATEGORIES, icon: FolderOpen },
  { label: "Analytics", href: ROUTES.ANALYTICS, icon: BarChart3 },
  { label: "Insights", href: ROUTES.INSIGHTS, icon: Sparkles },
  { label: "Notifications", href: ROUTES.NOTIFICATIONS, icon: BellRing },
  { label: "Profile", href: ROUTES.PROFILE, icon: UserCircle },
];

const adminNavItems = [
  { label: "Admin", href: ROUTES.ADMIN, icon: ShieldCheck },
  { label: "Users", href: ROUTES.ADMIN_USERS, icon: Users },
  { label: "Notifications", href: ROUTES.ADMIN_NOTIFICATIONS, icon: BellRing },
  { label: "Profile", href: ROUTES.PROFILE, icon: UserCircle },
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { prefetchRoute } = useNavigationPrefetch();
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const navItems = user?.role === "admin" ? adminNavItems : baseNavItems;

  const homeRoute = user?.role === "admin" ? ROUTES.ADMIN : ROUTES.DASHBOARD;

  return (
    <header className="sticky top-0 z-40 border-b border-gray-200 bg-white">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {/* Logo */}
        <Link
          href={homeRoute}
          className="flex items-center gap-2 text-xl font-bold text-brand-700"
        >
          💸 <span>FinSight</span>
        </Link>

        {/* Desktop Navigation */}
        <nav className="hidden items-center gap-1 md:flex" aria-label="Main navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onMouseEnter={() => prefetchRoute(item.href)}
                onFocus={() => prefetchRoute(item.href)}
                className={cn(
                  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                )}
                aria-current={isActive ? "page" : undefined}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </Link>
            );
          })}
        </nav>

        {/* Right side */}
        <div className="flex items-center gap-3">
          {/* Alerts bell */}
          <Link
            href={user?.role === "admin" ? ROUTES.ADMIN_NOTIFICATIONS : ROUTES.NOTIFICATIONS}
            onMouseEnter={() => prefetchRoute(user?.role === "admin" ? ROUTES.ADMIN_NOTIFICATIONS : ROUTES.NOTIFICATIONS)}
            onFocus={() => prefetchRoute(user?.role === "admin" ? ROUTES.ADMIN_NOTIFICATIONS : ROUTES.NOTIFICATIONS)}
            className="relative rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            aria-label="View alerts"
          >
            <Bell className="h-5 w-5" />
          </Link>

          {/* User menu */}
          {user && (
            <div className="hidden items-center gap-2 md:flex">
              <span className="text-sm text-gray-600">{user.full_name}</span>
              <button
                onClick={() => logout()}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-red-600"
                aria-label="Log out"
              >
                <LogOut className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Mobile menu toggle */}
          <button
            className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 md:hidden"
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            aria-label="Toggle navigation menu"
            aria-expanded={isMobileOpen}
          >
            {isMobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Navigation */}
      {isMobileOpen && (
        <nav className="border-t bg-white px-4 py-3 md:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <Link
                key={item.href}
                href={item.href}
                onTouchStart={() => prefetchRoute(item.href)}
                onClick={() => setIsMobileOpen(false)}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium",
                  isActive
                    ? "bg-brand-50 text-brand-700"
                    : "text-gray-600 hover:bg-gray-100"
                )}
              >
                <Icon className="h-5 w-5" />
                {item.label}
              </Link>
            );
          })}
          {user && (
            <button
              onClick={() => { logout(); setIsMobileOpen(false); }}
              className="mt-2 flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-red-600 hover:bg-red-50"
            >
              <LogOut className="h-5 w-5" />
              Log out
            </button>
          )}
        </nav>
      )}
    </header>
  );
}

export default Navbar;
