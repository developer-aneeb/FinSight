import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { message } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { dismissInsight } from "@modules/insights/insights.service";

export const DELETE = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireStandardUser(req);
  await dismissInsight(user.id, context.params.id);
  return withCors(req, message("Insight dismissed"), "DELETE,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "DELETE,OPTIONS");
}