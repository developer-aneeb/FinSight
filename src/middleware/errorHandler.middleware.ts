/**
 * FinSight — Centralized Error Handler Middleware (Express)
 */
import { Request, Response, NextFunction } from "express";
import { ZodError } from "zod";
import logger from "../utils/logger";

/** Custom API Error class */
export class ApiError extends Error {
  public statusCode: number;
  public details?: unknown;

  constructor(statusCode: number, message: string, details?: unknown) {
    super(message);
    this.statusCode = statusCode;
    this.name = "ApiError";
    this.details = details;
  }
}

export class NotFoundError extends ApiError {
  constructor(resource = "Resource") {
    super(404, `${resource} not found`);
    this.name = "NotFoundError";
  }
}

export class ValidationError extends ApiError {
  constructor(message: string, details?: unknown) {
    super(400, message, details);
    this.name = "ValidationError";
  }
}

export class UnauthorizedError extends ApiError {
  constructor(message = "Authentication required") {
    super(401, message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends ApiError {
  constructor(message = "Access denied") {
    super(403, message);
    this.name = "ForbiddenError";
  }
}

/**
 * Express global error-handling middleware.
 * Must be registered LAST (after all routes).
 */
export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // ── Zod validation errors ──────────────────────────────
  if (err instanceof ZodError) {
    const messages = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`);
    logger.warn("Validation error", { errors: messages });
    res.status(400).json({
      success: false,
      error: "Validation failed",
      message: messages.join("; "),
    });
    return;
  }

  // ── Custom API errors ─────────────────────────────────
  if (err instanceof ApiError) {
    logger.warn(`API Error [${err.statusCode}]: ${err.message}`, {
      details: err.details,
    });
    res.status(err.statusCode).json({
      success: false,
      error: err.message,
    });
    return;
  }

  // ── Supabase errors (have .code property) ─────────────
  if (err && typeof err === "object" && "code" in err) {
    const se = err as Error & { code: string };
    logger.error("Supabase error", { code: se.code, message: se.message });
    res.status(500).json({
      success: false,
      error: "Database operation failed",
      message: se.message,
    });
    return;
  }

  // ── Generic / unhandled errors ────────────────────────
  logger.error("Unhandled error", { message: err.message, stack: err.stack });
  const isProduction = process.env.NODE_ENV === "production";
  res.status(500).json({
    success: false,
    error: isProduction ? "Internal server error" : err.message,
  });
}

/**
 * 404 handler for undefined routes
 */
export function notFoundHandler(_req: Request, res: Response): void {
  res.status(404).json({
    success: false,
    error: "Route not found",
  });
}
