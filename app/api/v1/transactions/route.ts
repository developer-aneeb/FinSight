import { NextRequest, NextResponse } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { created } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import {
  createTransaction,
  listTransactions,
} from "@modules/transactions/transactions.service";
import { z } from "zod";

const transactionCreateSchema = z
  .object({
    type: z.string().trim().min(1),
    amount: z.number().positive(),
    category_id: z.string().uuid().optional(),
    description: z.string().trim().max(500).optional(),
    notes: z.string().trim().max(2000).optional(),
    transaction_date: z.string().optional(),
    is_recurring: z.boolean().default(false),
    recurrence: z.enum(["none", "daily", "weekly", "monthly", "yearly"]).default("none"),
  })
  .superRefine((payload, ctx) => {
    if (payload.is_recurring && payload.recurrence === "none") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrence"],
        message: "Recurrence frequency is required for recurring transactions",
      });
    }

    if (!payload.is_recurring && payload.recurrence !== "none") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["recurrence"],
        message: "Recurrence must be 'none' when transaction is not recurring",
      });
    }
  });

const querySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
  search: z.string().trim().optional(),
  type: z.string().trim().min(1).optional(),
  categoryId: z.string().uuid().optional(),
  dateFrom: z.string().optional(),
  dateTo: z.string().optional(),
  amountMin: z.coerce.number().optional(),
  amountMax: z.coerce.number().optional(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const params = validateBody(querySchema, {
    page: req.nextUrl.searchParams.get("page") || undefined,
    pageSize: req.nextUrl.searchParams.get("pageSize") || undefined,
    search: req.nextUrl.searchParams.get("search") || undefined,
    type: req.nextUrl.searchParams.get("type") || undefined,
    categoryId: req.nextUrl.searchParams.get("categoryId") || undefined,
    dateFrom: req.nextUrl.searchParams.get("dateFrom") || undefined,
    dateTo: req.nextUrl.searchParams.get("dateTo") || undefined,
    amountMin: req.nextUrl.searchParams.get("amountMin") || undefined,
    amountMax: req.nextUrl.searchParams.get("amountMax") || undefined,
  });

  const result = await listTransactions(user.id, params);

  return withCors(
    req,
    NextResponse.json({
      success: true,
      data: result.data,
      pagination: result.pagination,
      total: result.pagination.total,
      page: result.pagination.page,
      pageSize: result.pagination.pageSize,
      totalPages: result.pagination.totalPages,
    }),
    "GET,POST,OPTIONS"
  );
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const payload = validateBody(transactionCreateSchema, await req.json());
  const transaction = await createTransaction(user.id, payload);
  return withCors(req, created(transaction), "GET,POST,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,POST,OPTIONS");
}
