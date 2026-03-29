import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { created, ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { createBudget, listBudgets } from "@modules/budgets/budgets.service";
import { z } from "zod";

const budgetCreateSchema = z.object({
  category_id: z.string().uuid().optional(),
  name: z.string().trim().min(1).max(100),
  amount_limit: z.number().positive(),
  period: z.string().trim().min(1).default("monthly"),
  start_date: z.string().optional(),
  end_date: z.string().nullable().optional(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const budgets = await listBudgets(user.id);
  return withCors(req, ok(budgets), "GET,POST,OPTIONS");
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const payload = validateBody(budgetCreateSchema, await req.json());
  const budget = await createBudget(user.id, payload);
  return withCors(req, created(budget), "GET,POST,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,POST,OPTIONS");
}
