/**
 * FinSight — Admin Controller
 */
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import { getSupabaseServiceClient } from "../config/supabase";
import { sendSuccess, sendPaginated } from "../helpers/response.helper";
import { parsePagination } from "../helpers/pagination.helper";

/** GET /admin/users */
export async function listUsers(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { page, pageSize, offset } = parsePagination(req);
    const supabase = getSupabaseServiceClient();

    // Get total count
    const { count } = await supabase
      .from("profiles")
      .select("*", { count: "exact", head: true });

    // Get paginated users
    const { data, error } = await supabase
      .from("profiles")
      .select("id, email, full_name, role, avatar_url, created_at, updated_at")
      .order("created_at", { ascending: false })
      .range(offset, offset + pageSize - 1);

    if (error) throw error;

    sendPaginated(res, data || [], count || 0, page, pageSize);
  } catch (err) {
    next(err);
  }
}

/** GET /admin/stats */
export async function getStats(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const supabase = getSupabaseServiceClient();

    const [usersResult, transactionsResult, budgetsResult] = await Promise.all([
      supabase.from("profiles").select("*", { count: "exact", head: true }),
      supabase.from("transactions").select("*", { count: "exact", head: true }),
      supabase.from("budgets").select("*", { count: "exact", head: true }),
    ]);

    sendSuccess(res, {
      totalUsers: usersResult.count || 0,
      totalTransactions: transactionsResult.count || 0,
      totalBudgets: budgetsResult.count || 0,
    });
  } catch (err) {
    next(err);
  }
}
