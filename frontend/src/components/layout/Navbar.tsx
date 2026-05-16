/**
 * FinSight — Sidebar Navigation
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
import { LogoIcon } from "@/components/icons";
import {
  LayoutDashboard,
  Users,
  ArrowLeftRight,
  PiggyBank,
  FolderOpen,
  BarChart3,
  BellRing,
  ShieldCheck,
  LogOut,
  Menu,
  X,
  Sparkles,
  UserCircle,
  Settings,
  ChevronLeft,
  ChevronRight,
  MessageCircle,
  CircleHelp,
  LifeBuoy,
} from "lucide-react";

const userNavItems = [
  { label: "Home", href: ROUTES.DASHBOARD, icon: LayoutDashboard },
  { label: "Transactions", href: ROUTES.TRANSACTIONS, icon: ArrowLeftRight },
  { label: "Analytics", href: ROUTES.ANALYTICS, icon: BarChart3 },
  { label: "Budgets", href: ROUTES.BUDGETS, icon: PiggyBank },
  { label: "Category", href: ROUTES.CATEGORIES, icon: FolderOpen },
  { label: "AI Hub", href: ROUTES.INSIGHTS, icon: Sparkles },
  { label: "Live Chatbot", href: ROUTES.LIVE_CHATBOT, icon: MessageCircle },
  { label: "FAQ", href: ROUTES.FAQ, icon: CircleHelp },
  { label: "Help Center", href: ROUTES.HELP_CENTER, icon: LifeBuoy },
  { label: "Support", href: ROUTES.SUPPORT_TICKETS, icon: MessageCircle },
  { label: "Profile", href: ROUTES.PROFILE, icon: UserCircle },
  { label: "Settings", href: ROUTES.SETTINGS, icon: Settings },
  { label: "Notifications", href: ROUTES.NOTIFICATIONS, icon: BellRing },
];

const adminNavItems = [
  { label: "Admin Home", href: ROUTES.ADMIN, icon: ShieldCheck },
  { label: "Users", href: ROUTES.ADMIN_USERS, icon: Users },
  { label: "Notifications", href: ROUTES.ADMIN_NOTIFICATIONS, icon: BellRing },
  { label: "Support Tickets", href: ROUTES.ADMIN_SUPPORT_TICKETS, icon: MessageCircle },
  { label: "Profile", href: ROUTES.PROFILE, icon: UserCircle },
  { label: "Settings", href: ROUTES.SETTINGS, icon: Settings },
];

export function Navbar() {
  const pathname = usePathname();
  const { user } = useAuthStore();
  const { logout } = useAuth();
  const { prefetchRoute } = useNavigationPrefetch();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const isAdmin = user?.role === "admin";
  const navItems = isAdmin ? adminNavItems : userNavItems;

  const navContent = (
    <>
      <div className="mb-5 flex items-center justify-between">
        <Link href={isAdmin ? ROUTES.ADMIN : ROUTES.DASHBOARD} className={cn("flex items-center", isCollapsed ? "justify-center w-full" : "gap-2")}> 
          <LogoIcon width={32} height={32} />
          {!isCollapsed && <span className="text-[32px] font-semibold tracking-[-0.02em] text-[#123c58]">FinSight</span>}
        </Link>
        <button
          onClick={() => setIsCollapsed((prev) => !prev)}
          className="hidden lg:grid h-7 w-7 place-items-center rounded-full border border-white/50 bg-white/25 text-white"
          aria-label={isCollapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {isCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>

      <nav className="space-y-1 text-[15px] font-medium flex-1" aria-label="Sidebar navigation">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => {
                if (isMobileOpen) {
                  setIsMobileOpen(false);
                }
              }}
              onMouseEnter={() => prefetchRoute(item.href)}
              onFocus={() => prefetchRoute(item.href)}
              className={cn(
                "flex items-center rounded-[12px] py-2.5 transition-colors",
                isCollapsed ? "justify-center px-2" : "gap-2.5 px-3",
                isActive
                  ? "border border-white/45 bg-[#d8fff5]/40 text-[#f2ffff] shadow-[inset_0_1px_0_rgba(255,255,255,0.55)]"
                  : "text-[#0e3954] hover:bg-white/20"
              )}
              aria-current={isActive ? "page" : undefined}
            >
              <Icon className={cn("h-5 w-5", item.label === "AI Hub" ? "text-emerald-500" : "")} />
              {!isCollapsed && item.label}
            </Link>
          );
        })}
      </nav>

      <button
        onClick={() => logout()}
        className={cn(
          "mt-2 flex items-center text-[15px] font-medium text-[#1c4460] hover:text-[#0a2e45]",
          isCollapsed ? "justify-center" : "gap-2 px-1"
        )}
      >
        <LogOut className="h-5 w-5" /> {!isCollapsed && "Logout"}
      </button>
    </>
  );

  return (
    <>
      <button
        className="fixed left-3 top-3 z-40 grid h-11 w-11 place-items-center rounded-full border border-white/45 bg-[#0f5d79]/70 text-white backdrop-blur-md lg:hidden"
        onClick={() => setIsMobileOpen(true)}
        aria-label="Open sidebar"
      >
        <Menu className="h-5 w-5" />
      </button>

      <aside
        className={cn(
          "hidden lg:flex shrink-0 flex-col rounded-[20px] border border-white/25 bg-[linear-gradient(180deg,rgba(198,247,239,0.56)_0%,rgba(149,222,230,0.40)_40%,rgba(121,178,215,0.38)_100%)] pb-4 pt-4 text-[#0b2c43] backdrop-blur-md transition-all duration-300",
          isCollapsed ? "w-[92px] px-2" : "w-[240px] px-3"
        )}
      >
        {navContent}
      </aside>

      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            className="absolute inset-0 bg-[#082639]/55"
            onClick={() => setIsMobileOpen(false)}
            aria-label="Close sidebar backdrop"
          />
          <aside className="relative h-full w-[300px] max-w-[86vw] border-r border-white/35 bg-[linear-gradient(180deg,rgba(198,247,239,0.78)_0%,rgba(149,222,230,0.66)_40%,rgba(121,178,215,0.60)_100%)] px-3 pb-4 pt-4 backdrop-blur-xl">
            <button
              className="absolute right-3 top-3 grid h-8 w-8 place-items-center rounded-full border border-white/50 bg-white/25 text-white"
              onClick={() => setIsMobileOpen(false)}
              aria-label="Close sidebar"
            >
              <X className="h-4 w-4" />
            </button>
            {navContent}
          </aside>
        </div>
      )}
    </>
  );
}

export default Navbar;
