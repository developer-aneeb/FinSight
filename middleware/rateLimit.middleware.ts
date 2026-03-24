import { NextRequest } from "next/server";
import rateLimitConfig from "@config/rateLimit";
import { HttpError } from "@utils/error";

type Entry = { count: number; resetAt: number };

const rateLimitStore = new Map<string, Entry>();

export function enforceRateLimit(req: NextRequest): void {
  const key = req.headers.get("x-forwarded-for") || req.ip || "unknown";
  const now = Date.now();

  const current = rateLimitStore.get(key);
  if (!current || now > current.resetAt) {
    rateLimitStore.set(key, { count: 1, resetAt: now + rateLimitConfig.windowMs });
    return;
  }

  if (current.count >= rateLimitConfig.max) {
    throw new HttpError(429, "Too many requests");
  }

  current.count += 1;
  rateLimitStore.set(key, current);
}
