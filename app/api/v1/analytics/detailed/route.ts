import { NextRequest } from "next/server";
import { requireUser } from "@middleware/auth.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { getDetailedAnalytics } from "@modules/analytics/analytics.service";
import { optionsResponse, withCors } from "@utils/cors";

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const month = req.nextUrl.searchParams.get("month") || undefined;
  const details = await getDetailedAnalytics(user.id, month);
  return withCors(req, ok(details), "GET,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,OPTIONS");
}
