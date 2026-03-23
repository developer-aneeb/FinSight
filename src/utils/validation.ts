/**
 * FinSight — Input Validation Utilities (Backend)
 * Zod schemas + sanitization helpers
 */
import validator from "validator";
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

export function sanitize(input: string): string {
  return validator.escape(validator.trim(input));
}

export function sanitizeEmail(email: string): string | null {
  const normalized = validator.normalizeEmail(email);
  if (!normalized || !validator.isEmail(normalized)) return null;
  return normalized;
}

export function isValidUUID(id: string): boolean {
  return validator.isUUID(id, 4);
}

export function isValidDate(date: string): boolean {
  return validator.isDate(date, { format: "YYYY-MM-DD" });
}

export function isPositiveNumber(value: unknown): value is number {
  return typeof value === "number" && value > 0 && isFinite(value);
}
