import { NextRequest } from "next/server";
import { requireUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { created, ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { createCategory, listCategories } from "@modules/categories/categories.service";
import { z } from "zod";

const categoryCreateSchema = z.object({
  name: z.string().trim().min(1).max(50),
  icon: z.string().trim().max(10).default("📁"),
  color: z.string().trim().max(20).default("#6B7280"),
  parent_id: z.string().uuid().nullable().optional(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const categories = await listCategories(user.id);
  return withCors(req, ok(categories), "GET,POST,OPTIONS");
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const payload = validateBody(categoryCreateSchema, await req.json());
  const category = await createCategory(user.id, payload);
  return withCors(req, created(category), "GET,POST,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,POST,OPTIONS");
}
