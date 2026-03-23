/**
 * FinSight — Alert Controller
 */
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import type { AlertStatus } from "../types";
import * as alertService from "../services/alert.service";
import { sendSuccess, sendMessage } from "../helpers/response.helper";

/** GET /alerts */
export async function listAlerts(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const status = req.query.status as AlertStatus | undefined;
    const alerts = await alertService.listAlerts(userId, status);
    sendSuccess(res, alerts);
  } catch (err) {
    next(err);
  }
}

/** PATCH /alerts/:id */
export async function updateAlertStatus(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { status } = req.body;
    const alert = await alertService.updateAlertStatus(userId, req.params.id, status);
    sendSuccess(res, alert);
  } catch (err) {
    next(err);
  }
}

/** PATCH /alerts/read-all */
export async function markAllRead(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    // Mark all unread alerts as read
    const alerts = await alertService.listAlerts(userId, "unread");
    for (const alert of alerts) {
      await alertService.updateAlertStatus(userId, alert.id, "read");
    }
    sendMessage(res, "All alerts marked as read");
  } catch (err) {
    next(err);
  }
}
