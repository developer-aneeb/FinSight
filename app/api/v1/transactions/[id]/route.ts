import { NextRequest } from "next/server";
import { requireUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { message, ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import {
  deleteTransaction,
  getTransactionById,
  updateTransaction,
} from "@modules/transactions/transactions.service";
import { z } from "zod";

const transactionUpdateSchema = z
  .object({
    type: z.string().trim().min(1).optional(),
    amount: z.number().positive().optional(),
    category_id: z.string().uuid().optional(),
    description: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(2000).optional(),
    transaction_date: z.string().optional(),
    is_recurring: z.boolean().optional(),
    recurrence: z.string().trim().min(1).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

export const GET = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireUser(req);
  const transaction = await getTransactionById(user.id, context.params.id);
  return withCors(req, ok(transaction), "GET,PUT,DELETE,OPTIONS");
});

export const PUT = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireUser(req);
  const payload = validateBody(transactionUpdateSchema, await req.json());
  const transaction = await updateTransaction(user.id, context.params.id, payload);
  return withCors(req, ok(transaction), "GET,PUT,DELETE,OPTIONS");
});

export const DELETE = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireUser(req);
  await deleteTransaction(user.id, context.params.id);
  return withCors(req, message("Transaction deleted"), "GET,PUT,DELETE,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,PUT,DELETE,OPTIONS");
}
