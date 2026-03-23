/**
 * FinSight — Insight Controller
 */
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import * as insightService from "../services/insight.service";
import { sendSuccess, sendMessage } from "../helpers/response.helper";

/** GET /insights */
export async function listInsights(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const insights = await insightService.listInsights(userId);
    sendSuccess(res, insights);
  } catch (err) {
    next(err);
  }
}

/** PATCH /insights/:id/dismiss */
export async function dismissInsight(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    await insightService.dismissInsight(userId, req.params.id);
    sendMessage(res, "Insight dismissed");
  } catch (err) {
    next(err);
  }
}
