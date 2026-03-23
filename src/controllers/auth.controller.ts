/**
 * FinSight — Auth Controller
 */
import { Request, Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import * as authService from "../services/auth.service";
import { sendSuccess, sendCreated, sendMessage, sendError } from "../helpers/response.helper";
import logger from "../utils/logger";

/** POST /auth/signup */
export async function signup(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await authService.signUp(req.body);
    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}

/** POST /auth/login */
export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const data = await authService.signIn(req.body);

    // Set HTTP-only cookie for the access token
    if (data?.session?.access_token) {
      res.cookie("sb-access-token", data.session.access_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 60 * 60 * 24 * 7 * 1000, // 7 days
        path: "/",
      });
    }

    sendSuccess(res, {
      user: data.user,
      access_token: data.session?.access_token,
      refresh_token: data.session?.refresh_token,
    });
  } catch (err) {
    next(err);
  }
}

/** POST /auth/logout */
export async function logout(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const token = req.headers.authorization?.replace("Bearer ", "") || "";
    await authService.signOut(token);

    // Clear the cookie
    res.clearCookie("sb-access-token", { path: "/" });

    sendMessage(res, "Logged out successfully");
  } catch (err) {
    next(err);
  }
}

/** GET /auth/profile */
export async function getProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const profile = await authService.getProfile(userId);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}

/** PUT /auth/profile */
export async function updateProfile(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const profile = await authService.updateProfile(userId, req.body);
    sendSuccess(res, profile);
  } catch (err) {
    next(err);
  }
}

/** POST /auth/reset-password */
export async function resetPassword(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const { email } = req.body;
    const redirectTo = req.body.redirectTo || `${process.env.FRONTEND_URL || "http://localhost:3000"}/reset-password`;
    await authService.resetPassword(email, redirectTo);
    sendMessage(res, "Password reset email sent");
  } catch (err) {
    next(err);
  }
}
