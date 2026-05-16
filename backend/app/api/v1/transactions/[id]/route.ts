import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
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

const transactionTypeSchema = z.enum(["income", "expense"]);
const recurrenceSchema = z.enum(["none", "daily", "weekly", "monthly", "yearly"]);
const dateStringSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format");

const normalizedTagsSchema = z
  .array(z.string().trim().min(1).max(50))
  .max(20)
  .transform((tags) => Array.from(new Set(tags.map((tag) => tag.trim()).filter(Boolean))));

const transactionUpdateSchema = z
  .object({
    type: transactionTypeSchema.optional(),
    amount: z.coerce.number().positive().max(99999999999.99).optional(),
    category_id: z.string().uuid().optional(),
    description: z.string().trim().min(1, "Description cannot be empty").max(500).optional(),
    notes: z.string().trim().max(2000).optional(),
    transaction_date: dateStringSchema.optional(),
    is_recurring: z.boolean().optional(),
    recurrence: recurrenceSchema.optional(),
    tags: normalizedTagsSchema.optional(),
  })
  .superRefine((payload, ctx) => {
    if (payload.is_recurring === true && payload.recurrence === "none") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrence"],
        message: "Recurrence frequency is required for recurring transactions",
      });
    }

    if (payload.is_recurring === false && payload.recurrence && payload.recurrence !== "none") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrence"],
        message: "Recurrence must be 'none' when recurring is disabled",
      });
    }
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

export const GET = asyncHandler(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const user = await requireStandardUser(req);
  const { id } = await context.params;
  const transaction = await getTransactionById(user.id, id);
  return withCors(req, ok(transaction), "GET,PUT,DELETE,OPTIONS");
});

export const PUT = asyncHandler(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const user = await requireStandardUser(req);
  const payload = validateBody(transactionUpdateSchema, await req.json());
  const { id } = await context.params;
  const transaction = await updateTransaction(user.id, id, payload);
  return withCors(req, ok(transaction), "GET,PUT,DELETE,OPTIONS");
});

export const DELETE = asyncHandler(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const user = await requireStandardUser(req);
  const { id } = await context.params;
  await deleteTransaction(user.id, id);
  return withCors(req, message("Transaction deleted"), "GET,PUT,DELETE,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,PUT,DELETE,OPTIONS");
}
