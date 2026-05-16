import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@utils/asyncHandler";
import { created, ok } from "@utils/apiResponse";
import { validateBody } from "@middleware/validate.middleware";
import { requireUser } from "@middleware/auth.middleware";
import {
  createSupportTicket,
  listSupportTicketsForUser,
  type SupportTicketStatus,
} from "@modules/support/supportTickets.service";

const ticketTypeSchema = z.enum(["message", "review"]);
const statusSchema = z.enum(["open", "in_review", "resolved", "closed"]);

const createTicketSchema = z
  .object({
    subject: z.string().trim().min(3).max(120),
    message: z.string().trim().min(10).max(2000),
    ticket_type: ticketTypeSchema.default("message"),
    rating: z.coerce.number().int().min(1).max(5).optional(),
  })
  .superRefine((payload, ctx) => {
    if (payload.ticket_type === "review" && typeof payload.rating !== "number") {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rating"],
        message: "Rating is required for review tickets",
      });
    }

    if (payload.ticket_type === "message" && payload.rating !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["rating"],
        message: "Rating is only allowed for review tickets",
      });
    }
  });

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(50),
  status: statusSchema.optional(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const query = validateBody(querySchema, {
    limit: req.nextUrl.searchParams.get("limit") || undefined,
    status: req.nextUrl.searchParams.get("status") || undefined,
  });

  const tickets = await listSupportTicketsForUser(user.id, {
    limit: query.limit,
    status: query.status as SupportTicketStatus | undefined,
  });

  return ok(tickets);
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const payload = validateBody(createTicketSchema, await req.json());

  const ticket = await createSupportTicket(user.id, payload);
  return created(ticket);
});
