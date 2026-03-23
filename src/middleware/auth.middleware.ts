/**
 * FinSight — Auth Middleware (Express)
 * Verifies Supabase JWT and attaches user to req.user
 */
import { Response, NextFunction } from "express";
import { getSupabaseServiceClient } from "../config/supabase";
import logger from "../utils/logger";
import { sendError } from "../helpers/response.helper";
import { AuthenticatedRequest, AuthenticatedUser } from "../types";

/**
 * Middleware that verifies the Bearer token and attaches user to request.
 * Rejects with 401 if token is missing or invalid.
 */
export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader?.startsWith("Bearer ")) {
    logger.warn("Missing or invalid authorization header", {
      ip: req.ip,
      path: req.path,
    });
    sendError(res, "Authentication required", 401);
    return;
  }

  const token = authHeader.replace("Bearer ", "");
  const supabase = getSupabaseServiceClient();

  supabase.auth
    .getUser(token)
    .then(async ({ data: { user }, error }) => {
      if (error || !user) {
        logger.warn("Invalid auth token", { error: error?.message });
        sendError(res, "Invalid or expired token", 401);
        return;
      }

      // Fetch profile for role
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", user.id)
        .single();

      req.user = {
        id: user.id,
        email: user.email!,
        role: profile?.role || "user",
      } as AuthenticatedUser;

      next();
    })
    .catch((err) => {
      logger.error("Auth verification failed", { error: (err as Error).message });
      sendError(res, "Authentication failed", 401);
    });
}

/**
 * Middleware that requires user to have "admin" role.
 * Must be used after `authenticate`.
 */
export function requireAdmin(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== "admin") {
    sendError(res, "Admin access required", 403);
    return;
  }
  next();
}
