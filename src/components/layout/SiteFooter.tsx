import Link from "next/link";
import { ROUTES } from "@/utils/constants";

interface SiteFooterProps {
  compact?: boolean;
}

export function SiteFooter({ compact = false }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-gray-200 bg-white/80">
      <div
        className={`mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 ${
          compact ? "py-4" : "py-6"
        } sm:flex-row`}
      >
        <p className="text-sm text-gray-500">
          © {year} FinSight. Built for smarter money decisions.
        </p>

        <nav className="flex items-center gap-4 text-sm" aria-label="Footer links">
          <Link href={ROUTES.HOME} className="text-gray-500 transition hover:text-brand-700">
            Home
          </Link>
          <Link href={ROUTES.LOGIN} className="text-gray-500 transition hover:text-brand-700">
            Sign In
          </Link>
          <Link href={ROUTES.SIGNUP} className="text-gray-500 transition hover:text-brand-700">
            Sign Up
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default SiteFooter;