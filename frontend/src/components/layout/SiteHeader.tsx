import Link from "next/link";
import { ROUTES } from "@/utils/constants";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b border-gray-200/70 bg-white/90 backdrop-blur">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href={ROUTES.HOME}
          className="flex items-center gap-2 text-xl font-bold text-brand-700"
        >
          <span aria-hidden>💸</span>
          <span>FinSight</span>
        </Link>

        <nav className="flex items-center gap-3" aria-label="Primary">
          <Link
            href={ROUTES.LOGIN}
            className="text-sm font-medium text-gray-600 transition hover:text-brand-700"
          >
            Sign In
          </Link>
          <Link
            href={ROUTES.SIGNUP}
            className="rounded-lg bg-brand-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-brand-700"
          >
            Get Started
          </Link>
        </nav>
      </div>
    </header>
  );
}

export default SiteHeader;