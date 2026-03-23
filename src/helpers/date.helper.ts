/**
 * FinSight — Date Helpers
 */

/** Convert Date to YYYY-MM-DD string */
export function toISODate(date: Date): string {
  return date.toISOString().split("T")[0];
}

/** Get current month date range */
export function getCurrentMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth(), 1);
  const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
  return { start: toISODate(start), end: toISODate(end) };
}

/** Get previous month date range */
export function getPreviousMonthRange(): { start: string; end: string } {
  const now = new Date();
  const start = new Date(now.getFullYear(), now.getMonth() - 1, 1);
  const end = new Date(now.getFullYear(), now.getMonth(), 0);
  return { start: toISODate(start), end: toISODate(end) };
}

/** Get the month start/end for a given year and month (1-based) */
export function getMonthRange(year: number, month: number): { start: string; end: string } {
  const start = new Date(year, month - 1, 1);
  const end = new Date(year, month, 0);
  return { start: toISODate(start), end: toISODate(end) };
}
