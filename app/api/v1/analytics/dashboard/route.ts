import { NextRequest } from "next/server";
import { requireUser } from "@middleware/auth.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { getDashboardSummary } from "@modules/analytics/analytics.service";
import { optionsResponse, withCors } from "@utils/cors";

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const summary = await getDashboardSummary(user.id);
  return withCors(req, ok(summary), "GET,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,OPTIONS");
}
