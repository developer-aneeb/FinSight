import { NextRequest } from "next/server";
import { requireUser } from "@middleware/auth.middleware";
import { getProfile, updateProfile } from "@modules/auth/auth.service";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { validateBody } from "@middleware/validate.middleware";
import { z } from "zod";

const profileUpdateSchema = z.object({
  full_name: z.string().min(1).optional(),
  avatar_url: z.string().url().nullable().optional(),
  preferred_currency: z.string().min(3).max(3).optional(),
  language: z.enum(["en", "ur"]).optional(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const profile = await getProfile(user.id);
  return ok(profile);
});

export const PATCH = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const body = validateBody(profileUpdateSchema, await req.json());
  const profile = await updateProfile(user.id, body);
  return ok(profile);
});
