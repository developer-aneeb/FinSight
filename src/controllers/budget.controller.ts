/**
 * FinSight — Budget Controller
 */
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import * as budgetService from "../services/budget.service";
import { sendSuccess, sendCreated, sendMessage } from "../helpers/response.helper";

/** GET /budgets */
export async function listBudgets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const budgets = await budgetService.listBudgets(userId);
    sendSuccess(res, budgets);
  } catch (err) {
    next(err);
  }
}

/** GET /budgets/active */
export async function getActiveBudgets(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const budgets = await budgetService.getActiveBudgets(userId);
    sendSuccess(res, budgets);
  } catch (err) {
    next(err);
  }
}

/** GET /budgets/:id */
export async function getBudget(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const budget = await budgetService.getBudget(userId, req.params.id);
    sendSuccess(res, budget);
  } catch (err) {
    next(err);
  }
}

/** POST /budgets */
export async function createBudget(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const budget = await budgetService.createBudget(userId, req.body);
    sendCreated(res, budget);
  } catch (err) {
    next(err);
  }
}

/** PUT /budgets/:id */
export async function updateBudget(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const budget = await budgetService.updateBudget(userId, { ...req.body, id: req.params.id });
    sendSuccess(res, budget);
  } catch (err) {
    next(err);
  }
}

/** DELETE /budgets/:id */
export async function deleteBudget(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    await budgetService.deleteBudget(userId, req.params.id);
    sendMessage(res, "Budget deleted");
  } catch (err) {
    next(err);
  }
}
