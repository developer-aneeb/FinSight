import { NextRequest } from "next/server";
import rateLimitConfig from "@config/rateLimit";
import { HttpError } from "@utils/error";

type Entry = { count: number; resetAt: number };

const rateLimitStore = new Map<string, Entry>();
let requestCounter = 0;

function getClientKey(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    return forwarded.split(",")[0]?.trim() || "unknown";
  }

  const realIp = req.headers.get("x-real-ip");
  if (realIp) {
    return realIp.trim();
  }

  return "unknown";
}

function cleanupExpiredEntries(now: number): void {
  requestCounter += 1;
  if (requestCounter % 200 !== 0) {
    return;
  }

  for (const [key, entry] of rateLimitStore.entries()) {
    if (now > entry.resetAt) {
      rateLimitStore.delete(key);
    }
  }
}

export function enforceRateLimit(req: NextRequest): void {
  const key = getClientKey(req);
  const now = Date.now();

  cleanupExpiredEntries(now);

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
