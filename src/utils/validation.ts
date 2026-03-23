/**
 * FinSight — Input Validation Utilities
 * Uses Zod for comprehensive validation
 */
import { z } from "zod";

// ─── Zod Schemas ────────────────────────────────────────────

export const loginSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const signupSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z
    .string()
    .min(8, "Password must be at least 8 characters")
    .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
    .regex(/[0-9]/, "Password must contain at least one number"),
  full_name: z.string().min(2, "Name must be at least 2 characters").max(100),
});

export const transactionSchema = z.object({
  type: z.enum(["income", "expense"]),
  amount: z.number().positive("Amount must be positive").max(99999999.99),
  category_id: z.string().uuid().optional(),
  description: z.string().max(500).optional().default(""),
  notes: z.string().max(2000).optional().default(""),
  transaction_date: z.string().optional(),
  is_recurring: z.boolean().optional().default(false),
  recurrence: z
    .enum(["none", "daily", "weekly", "monthly", "yearly"])
    .optional()
    .default("none"),
  tags: z.array(z.string().uuid()).optional().default([]),
});

export const budgetSchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().min(1, "Budget name is required").max(100),
  amount_limit: z.number().positive("Budget limit must be positive"),
  period: z.enum(["weekly", "monthly", "yearly"]).optional().default("monthly"),
  start_date: z.string().optional(),
  end_date: z.string().optional(),
});

export const categorySchema = z.object({
  name: z.string().min(1).max(50),
  icon: z.string().max(10).optional().default("📁"),
  color: z.string().max(20).optional().default("#6B7280"),
  parent_id: z.string().uuid().nullable().optional(),
});

export const tagSchema = z.object({
  name: z.string().min(1).max(30),
  color: z.string().max(20).optional().default("#3B82F6"),
});

// ─── Sanitization Helpers ───────────────────────────────────

/** Sanitize a string to prevent XSS */
export function sanitize(input: string): string {
  return input
    .trim()
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

/** Validate and sanitize an email */
export function sanitizeEmail(email: string): string | null {
  const trimmed = email.trim().toLowerCase();
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(trimmed)) return null;
  return trimmed;
}

/** Validate UUID */
export function isValidUUID(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id);
}

/** Validate date string (YYYY-MM-DD) */
export function isValidDate(date: string): boolean {
  return /^\d{4}-\d{2}-\d{2}$/.test(date) && !isNaN(Date.parse(date));
}

/** Validate positive number */
export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && value > 0 && isFinite(value);
}

/** Parse pagination params */
export function parsePagination(params: URLSearchParams): {
  page: number;
  pageSize: number;
} {
  const page = Math.max(1, parseInt(params.get("page") || "1", 10));
  const pageSize = Math.min(100, Math.max(1, parseInt(params.get("pageSize") || "20", 10)));
  return { page, pageSize };
}
