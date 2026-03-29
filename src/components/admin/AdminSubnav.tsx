"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ROUTES } from "@/utils/constants";
import { cn } from "@/utils/cn";

const tabs = [
  { label: "Analytics", href: ROUTES.ADMIN },
  { label: "Users", href: ROUTES.ADMIN_USERS },
  { label: "Notifications", href: ROUTES.ADMIN_NOTIFICATIONS },
];

export function AdminSubnav() {
  const pathname = usePathname();

  return (
    <nav className="flex items-center gap-2 overflow-x-auto" aria-label="Admin sections">
      {tabs.map((tab) => {
        const isActive = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "rounded-lg px-3 py-2 text-sm font-medium transition-colors",
              isActive
                ? "bg-brand-50 text-brand-700"
                : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}

export default AdminSubnav;
