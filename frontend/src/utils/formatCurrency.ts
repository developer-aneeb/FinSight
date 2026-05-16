/**
 * FinSight — Currency Formatting Utilities
 */

const currencyFormatters: Record<string, Intl.NumberFormat> = {};

/** Get or create a cached number formatter for a currency */
function getFormatter(currency: string): Intl.NumberFormat {
  if (!currencyFormatters[currency]) {
    currencyFormatters[currency] = new Intl.NumberFormat("en-PK", {
      style: "currency",
      currency,
      minimumFractionDigits: 0,
      maximumFractionDigits: 2,
    });
  }
  return currencyFormatters[currency];
}

/** Format an amount in the default currency (PKR) */
export function formatCurrency(amount: number, currency = "PKR"): string {
  return getFormatter(currency).format(amount);
}

/** Format a compact number (e.g., 1.5K, 2.3M) */
export function formatCompact(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M`;
  if (amount >= 1_000) return `${(amount / 1_000).toFixed(1)}K`;
  return amount.toFixed(0);
}

/** Calculate percentage (returns number with decimal precision) */
export function calcPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}
