/**
 * FinSight — Transaction Controller
 */
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import * as transactionService from "../services/transaction.service";
import * as searchService from "../services/search.service";
import { sendSuccess, sendCreated, sendMessage } from "../helpers/response.helper";
import logger from "../utils/logger";

/** GET /transactions */
export async function listTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { type, category_id, start_date, end_date, sort_by, sort_order, page, pageSize, search } = req.query;

    const result = await transactionService.listTransactions(userId, {
      type: type as any,
      category_id: category_id as string,
      date_from: start_date as string,
      date_to: end_date as string,
      search: search as string,
      sortBy: (sort_by as any) || "transaction_date",
      sortOrder: (sort_order as any) || "desc",
      page: page ? parseInt(page as string) : 1,
      pageSize: pageSize ? parseInt(pageSize as string) : 20,
    });

    res.json(result);
  } catch (err) {
    next(err);
  }
}

/** GET /transactions/:id */
export async function getTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const transaction = await transactionService.getTransaction(userId, req.params.id);
    sendSuccess(res, transaction);
  } catch (err) {
    next(err);
  }
}

/** POST /transactions */
export async function createTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const transaction = await transactionService.createTransaction(userId, req.body);

    // Async index to ElasticSearch (fire-and-forget)
    searchService.indexTransaction(transaction).catch((err) => {
      logger.warn("Failed to index transaction in ES", { id: transaction.id, error: err.message });
    });

    sendCreated(res, transaction);
  } catch (err) {
    next(err);
  }
}

/** PUT /transactions/:id */
export async function updateTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const transaction = await transactionService.updateTransaction(userId, { ...req.body, id: req.params.id });

    // Re-index in ES
    searchService.indexTransaction(transaction).catch((err) => {
      logger.warn("Failed to re-index transaction in ES", { id: transaction.id, error: err.message });
    });

    sendSuccess(res, transaction);
  } catch (err) {
    next(err);
  }
}

/** DELETE /transactions/:id */
export async function deleteTransaction(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    await transactionService.deleteTransaction(userId, req.params.id);

    // Remove from ES
    searchService.removeTransaction(req.params.id).catch((err) => {
      logger.warn("Failed to remove transaction from ES", { id: req.params.id, error: err.message });
    });

    sendMessage(res, "Transaction deleted");
  } catch (err) {
    next(err);
  }
}

/** GET /transactions/summary/monthly */
export async function getMonthlySummary(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const { year, month } = req.query;
    const y = year ? parseInt(year as string) : new Date().getFullYear();
    const m = month ? parseInt(month as string) : new Date().getMonth() + 1;
    const summary = await transactionService.getMonthlySummary(userId, y, m);
    sendSuccess(res, summary);
  } catch (err) {
    next(err);
  }
}
