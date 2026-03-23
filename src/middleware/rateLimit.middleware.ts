/**
 * FinSight — Rate Limit Middleware (Express)
 * Uses express-rate-limit for production-ready rate limiting
 */
import rateLimit from "express-rate-limit";
import config from "../config";

/** Default API rate limiter */
export const apiLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many requests. Please try again later.",
  },
});

/** Stricter limiter for auth endpoints (20 req / min) */
export const authLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many login attempts. Please try again later.",
  },
});

/** Upload limiter (10 req / min) */
export const uploadLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    error: "Too many uploads. Please try again later.",
  },
});
