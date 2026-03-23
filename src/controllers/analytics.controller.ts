/**
 * FinSight — Analytics Controller
 */
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import * as analyticsService from "../services/analytics.service";
import { sendSuccess } from "../helpers/response.helper";
import { getMonthRange } from "../helpers/date.helper";

/** GET /analytics/dashboard */
export async function getDashboard(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const dashboard = await analyticsService.getDashboardSummary(userId);
    sendSuccess(res, dashboard);
  } catch (err) {
    next(err);
  }
}

/** GET /analytics/detailed */
export async function getDetailedAnalytics(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { year, month } = req.query;
    const y = year ? parseInt(year as string) : new Date().getFullYear();
    const m = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const { start, end } = getMonthRange(y, m);
    const analytics = await analyticsService.getAnalyticsData(userId, start, end);
    sendSuccess(res, analytics);
  } catch (err) {
    next(err);
  }
}
