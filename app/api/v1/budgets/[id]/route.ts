import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { message, ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { deleteBudget, getBudgetById, updateBudget } from "@modules/budgets/budgets.service";
import { z } from "zod";

const budgetUpdateSchema = z
  .object({
    category_id: z.string().uuid().optional(),
    name: z.string().trim().min(1).max(100).optional(),
    amount_limit: z.number().positive().optional(),
    period: z.string().trim().min(1).optional(),
    start_date: z.string().optional(),
    end_date: z.string().nullable().optional(),
    is_active: z.boolean().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

export const GET = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireStandardUser(req);
  const budget = await getBudgetById(user.id, context.params.id);
  return withCors(req, ok(budget), "GET,PUT,DELETE,OPTIONS");
});

export const PUT = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireStandardUser(req);
  const payload = validateBody(budgetUpdateSchema, await req.json());
  const budget = await updateBudget(user.id, context.params.id, payload);
  return withCors(req, ok(budget), "GET,PUT,DELETE,OPTIONS");
});

export const DELETE = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireStandardUser(req);
  await deleteBudget(user.id, context.params.id);
  return withCors(req, message("Budget deleted"), "GET,PUT,DELETE,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,PUT,DELETE,OPTIONS");
}
