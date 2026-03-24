import { z } from "zod";

const normalizedEmail = z
  .string()
  .trim()
  .toLowerCase()
  .email("Invalid email address");

const strongPassword = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .regex(/[A-Z]/, "Password must contain at least one uppercase letter")
  .regex(/[0-9]/, "Password must contain at least one number");

const fullName = z
  .string()
  .trim()
  .min(2, "Full name must be at least 2 characters")
  .max(100, "Full name is too long");

export const signupSchema = z.object({
  email: normalizedEmail,
  password: strongPassword,
  full_name: fullName,
});

export const loginSchema = z.object({
  email: normalizedEmail,
  password: z.string().min(1, "Password is required"),
});

export const refreshSchema = z.object({
  refresh_token: z.string().trim().min(1, "refresh_token is required"),
});

export const resendSchema = z.object({
  email: normalizedEmail,
});

export const forgotPasswordSchema = z.object({
  email: normalizedEmail,
  redirectTo: z.string().url().optional(),
});

export const profileUpdateSchema = z
  .object({
    full_name: fullName.optional(),
    avatar_url: z.string().trim().url().nullable().optional(),
    preferred_currency: z
      .string()
      .trim()
      .toUpperCase()
      .length(3, "preferred_currency must be a 3-letter currency code")
      .optional(),
    language: z.enum(["en", "ur"]).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one profile field is required",
  });
