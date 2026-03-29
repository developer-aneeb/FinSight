import { NextRequest } from "next/server";
import { requireStandardUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { message, ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { deleteCategory, updateCategory } from "@modules/categories/categories.service";
import { z } from "zod";

const categoryUpdateSchema = z
  .object({
    name: z.string().trim().min(1).max(50).optional(),
    icon: z.string().trim().max(10).optional(),
    color: z.string().trim().max(20).optional(),
    parent_id: z.string().uuid().nullable().optional(),
  })
  .refine((payload) => Object.keys(payload).length > 0, {
    message: "At least one field is required",
  });

export const PUT = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireStandardUser(req);
  const payload = validateBody(categoryUpdateSchema, await req.json());
  const category = await updateCategory(user.id, context.params.id, payload);
  return withCors(req, ok(category), "PUT,DELETE,OPTIONS");
});

export const DELETE = asyncHandler(async (req: NextRequest, context: { params: { id: string } }) => {
  const user = await requireStandardUser(req);
  await deleteCategory(user.id, context.params.id);
  return withCors(req, message("Category deleted"), "PUT,DELETE,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "PUT,DELETE,OPTIONS");
}
