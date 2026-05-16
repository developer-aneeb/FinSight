import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { created, ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { createTag, listTags } from "@modules/tags/tags.service";
import { z } from "zod";

const createTagSchema = z.object({
  name: z.string().trim().min(1).max(50),
  color: z.string().trim().max(20).default("#3B82F6"),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const tags = await listTags(user.id);
  return withCors(req, ok(tags), "GET,POST,OPTIONS");
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const payload = validateBody(createTagSchema, await req.json());
  const tag = await createTag(user.id, payload);
  return withCors(req, created(tag), "GET,POST,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,POST,OPTIONS");
}