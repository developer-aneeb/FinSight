import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { getDetailedAnalytics } from "@modules/analytics/analytics.service";
import { optionsResponse, withCors } from "@utils/cors";
import { validateBody } from "@middleware/validate.middleware";
import { z } from "zod";

const querySchema = z.object({
  month: z
    .string()
    .regex(/^\d{4}-\d{2}$/, "Month must be in YYYY-MM format")
    .optional(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const params = validateBody(querySchema, {
    month: req.nextUrl.searchParams.get("month") || undefined,
  });
  const month = params.month;
  const details = await getDetailedAnalytics(user.id, month);
  return withCors(req, ok(details), "GET,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,OPTIONS");
}
