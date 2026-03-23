/**
 * FinSight — Validation Middleware (Express)
 * Generic middleware factory that validates req.body with a Zod schema
 */
import { Request, Response, NextFunction } from "express";
import { ZodSchema } from "zod";

/**
 * Returns a middleware that validates req.body against the given Zod schema.
 * On failure it forwards a ZodError to the error handler.
 */
export function validateBody(schema: ZodSchema) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    try {
      req.body = schema.parse(req.body);
      next();
    } catch (err) {
      next(err); // Will be caught by errorHandler middleware
    }
  };
}
