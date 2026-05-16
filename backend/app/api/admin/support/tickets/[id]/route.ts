import { NextRequest } from "next/server";
import { z } from "zod";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { validateBody } from "@middleware/validate.middleware";
import { requireAdminUser } from "@middleware/auth.middleware";
import { replyToSupportTicket, type SupportTicketStatus } from "@modules/support/supportTickets.service";

const statusSchema = z.enum(["open", "in_review", "resolved", "closed"]);

const replySchema = z.object({
  status: statusSchema,
  admin_response: z.string().trim().min(5).max(2000),
});

export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdminUser(req);
  const { id } = await params;
  const payload = validateBody(replySchema, await req.json());

  const ticket = await replyToSupportTicket(id, {
    status: payload.status as SupportTicketStatus,
    admin_response: payload.admin_response,
  });

  return ok(ticket);
});
