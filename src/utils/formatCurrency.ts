/**
 * FinSight — Currency Formatting Utilities (Backend)
 */

export function formatCurrency(amount: number, currency = "PKR"): string {
  return new Intl.NumberFormat("en-PK", {
    style: "currency",
    currency,
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  }).format(amount);
}

export function calcPercentage(part: number, total: number): number {
  if (total === 0) return 0;
  return (part / total) * 100;
}
