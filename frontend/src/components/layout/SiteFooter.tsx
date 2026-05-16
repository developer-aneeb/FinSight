import Link from "next/link";
import { ROUTES } from "@/utils/constants";
import { LogoIcon } from "@/components/icons";

interface SiteFooterProps {
  compact?: boolean;
}

export function SiteFooter({ compact = false }: SiteFooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-1.5 rounded-[16px] border border-white/25 bg-[linear-gradient(120deg,rgba(220,241,249,0.56),rgba(176,218,238,0.46))] text-[#0b2c43] backdrop-blur-md">
      <div
        className={`mx-auto flex max-w-7xl flex-col items-center justify-between gap-3 px-4 sm:px-6 ${
          compact ? "py-3" : "py-5"
        } sm:flex-row`}
      >
        <div className="flex items-center gap-2">
          <LogoIcon width={24} height={24} />
          <p className="text-sm text-[#1d4560]">© {year} FinSight. Built for smarter money decisions.</p>
        </div>

        <nav className="flex items-center gap-4 text-sm" aria-label="Footer links">
          <Link href={ROUTES.DASHBOARD} className="text-[#2b5974] transition hover:text-[#0a2e45]">
            Dashboard
          </Link>
          <Link href={ROUTES.TRANSACTIONS} className="text-[#2b5974] transition hover:text-[#0a2e45]">
            Transactions
          </Link>
          <Link href={ROUTES.BUDGETS} className="text-[#2b5974] transition hover:text-[#0a2e45]">
            Budgets
          </Link>
          <Link href={ROUTES.INSIGHTS} className="text-[#2b5974] transition hover:text-[#0a2e45]">
            AI Hub
          </Link>
        </nav>
      </div>
    </footer>
  );
}

export default SiteFooter;