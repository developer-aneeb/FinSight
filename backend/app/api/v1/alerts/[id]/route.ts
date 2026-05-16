import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { updateAlertStatus } from "@modules/alerts/alerts.service";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { HttpError } from "@utils/error";
import { ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { z } from "zod";

const updateAlertSchema = z.object({
  status: z.enum(["read", "dismissed"]),
});

export const PATCH = asyncHandler(async (req: NextRequest, context: { params: Promise<{ id: string }> }) => {
  const user = await requireStandardUser(req);
  const payload = validateBody(updateAlertSchema, await req.json());
  const { id } = await context.params;
  const updated = await updateAlertStatus(user.id, id, payload.status);

  if (!updated) {
    throw new HttpError(404, "Alert not found");
  }

  return withCors(req, ok(updated), "PATCH,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "PATCH,OPTIONS");
}
