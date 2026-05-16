import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { listAlerts } from "@modules/alerts/alerts.service";
import { asyncHandler } from "@utils/asyncHandler";
import { HttpError } from "@utils/error";
import { ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { z } from "zod";

const readAllSchema = z.object({
  status: z.enum(["read"]).optional(),
});

const listAlertsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(200).default(100),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const params = validateBody(listAlertsQuerySchema, {
    limit: req.nextUrl.searchParams.get("limit") || undefined,
  });
  const alerts = await listAlerts(user.id, params.limit);
  return withCors(req, ok(alerts), "GET,PATCH,OPTIONS");
});

export const PATCH = asyncHandler(async (req: NextRequest) => {
  await requireStandardUser(req);
  validateBody(readAllSchema, await req.json());
  throw new HttpError(501, "Use /api/v1/alerts/:id to update a specific alert");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,PATCH,OPTIONS");
}
