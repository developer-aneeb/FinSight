import { NextRequest } from "next/server";
import { requireUser } from "@middleware/auth.middleware";
import { getProfile } from "@modules/auth/auth.service";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const profile = await getProfile(user.id);
  return ok(profile);
});
