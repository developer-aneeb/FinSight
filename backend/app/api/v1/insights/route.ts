import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { generateInsights, listInsights } from "@modules/insights/insights.service";
import { validateBody } from "@middleware/validate.middleware";
import { z } from "zod";

const querySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const params = validateBody(querySchema, {
    limit: req.nextUrl.searchParams.get("limit") || undefined,
  });

  const data = await listInsights(user.id, params.limit);
  return withCors(req, ok(data), "GET,POST,OPTIONS");
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const generated = await generateInsights(user.id);
  return withCors(req, ok(generated), "GET,POST,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,POST,OPTIONS");
}