/**
 * FinSight — Date Helper Utilities
 */
import {
  format,
  parseISO,
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  subMonths,
  subDays,
  isWithinInterval,
  differenceInDays,
} from "date-fns";

/** Format a date string for display */
export function formatDate(dateStr: string, fmt = "dd MMM yyyy"): string {
  return format(parseISO(dateStr), fmt);
}

/** Format to short date (e.g., "01 Mar") */
export function formatShortDate(dateStr: string): string {
  return format(parseISO(dateStr), "dd MMM");
}

/** Format relative date (e.g., "Today", "Yesterday", "3 days ago") */
export function formatRelativeDate(dateStr: string): string {
  const date = parseISO(dateStr);
  const now = new Date();
  const days = differenceInDays(now, date);

  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days} days ago`;
  return format(date, "dd MMM yyyy");
}

/** Get current month date range */
export function getCurrentMonthRange(): { start: Date; end: Date } {
  const now = new Date();
  return { start: startOfMonth(now), end: endOfMonth(now) };
}

/** Get previous month date range */
export function getPreviousMonthRange(): { start: Date; end: Date } {
  const prev = subMonths(new Date(), 1);
  return { start: startOfMonth(prev), end: endOfMonth(prev) };
}

/** Get current week date range */
export function getCurrentWeekRange(): { start: Date; end: Date } {
  const now = new Date();
  return { start: startOfWeek(now, { weekStartsOn: 1 }), end: endOfWeek(now, { weekStartsOn: 1 }) };
}

/** Get last N days range */
export function getLastNDaysRange(n: number): { start: Date; end: Date } {
  return { start: subDays(new Date(), n), end: new Date() };
}

/** Check if a date is within a range */
export function isDateInRange(dateStr: string, start: Date, end: Date): boolean {
  return isWithinInterval(parseISO(dateStr), { start, end });
}

/** Format to ISO date string (YYYY-MM-DD) */
export function toISODate(date: Date): string {
  return format(date, "yyyy-MM-dd");
}

/** Get month label (e.g., "Mar 2026") */
export function getMonthLabel(dateStr: string): string {
  return format(parseISO(dateStr), "MMM yyyy");
}
