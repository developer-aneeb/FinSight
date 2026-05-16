import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { validateBody } from "@middleware/validate.middleware";
import { requireAdminUser } from "@middleware/auth.middleware";
import {
  listSupportTicketsForAdmin,
  type SupportTicketStatus,
} from "@modules/support/supportTickets.service";

const statusSchema = z.enum(["open", "in_review", "resolved", "closed"]);

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
  status: statusSchema.optional(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await requireAdminUser(req);

  const query = validateBody(querySchema, {
    limit: req.nextUrl.searchParams.get("limit") || undefined,
    status: req.nextUrl.searchParams.get("status") || undefined,
  });

  const tickets = await listSupportTicketsForAdmin({
    limit: query.limit,
    status: query.status as SupportTicketStatus | undefined,
  });

  return ok(tickets);
});
