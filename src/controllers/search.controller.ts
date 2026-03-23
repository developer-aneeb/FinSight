/**
 * FinSight — Search Controller
 */
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import * as searchService from "../services/search.service";
import { sendSuccess } from "../helpers/response.helper";
import { parsePagination } from "../helpers/pagination.helper";
import { ValidationError } from "../middleware/errorHandler.middleware";

/** GET /search */
export async function searchTransactions(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const q = req.query.q as string;

    if (!q || q.trim().length === 0) {
      throw new ValidationError("Search query 'q' is required");
    }

    const { page, pageSize } = parsePagination(req);
    const { results, total } = await searchService.searchTransactions(userId, q.trim(), page, pageSize);

    sendSuccess(res, {
      results,
      total,
      page,
      pageSize,
      totalPages: Math.ceil(total / pageSize),
    });
  } catch (err) {
    next(err);
  }
}
