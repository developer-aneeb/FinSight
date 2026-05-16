import validator from "validator";
import { z } from "zod";

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

export function sanitize(input: string): string {
  return validator.escape(validator.trim(input));
}

export function sanitizeEmail(email: string): string | null {
  const normalized = validator.normalizeEmail(email);
  if (!normalized || !validator.isEmail(normalized)) return null;
  return normalized;
}

export function validateImageFile(file: File): void {
  const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
  const maxFileSize = 5 * 1024 * 1024;

  if (!allowedMimeTypes.includes(file.type)) {
    throw new Error("Unsupported file type");
  }

  if (file.size > maxFileSize) {
    throw new Error("File size exceeds 5MB limit");
  }
}
