import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { message, ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { deleteTag, updateTag } from "@modules/tags/tags.service";
import { z } from "zod";

const updateTagSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    color: z.string().trim().max(20).optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

export const PUT = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireStandardUser(req);
  const payload = validateBody(updateTagSchema, await req.json());
  const tag = await updateTag(user.id, context.params.id, payload);
  return withCors(req, ok(tag), "PUT,DELETE,OPTIONS");
});

export const DELETE = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireStandardUser(req);
  await deleteTag(user.id, context.params.id);
  return withCors(req, message("Tag deleted"), "PUT,DELETE,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "PUT,DELETE,OPTIONS");
}