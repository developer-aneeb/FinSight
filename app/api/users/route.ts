import { NextRequest } from "next/server";
import { requireUser } from "@middleware/auth.middleware";
import { getUserProfile } from "@modules/users/user.service";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { HttpError } from "@utils/error";

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const profile = await getUserProfile(user.id);

  if (!profile) {
    throw new HttpError(404, "User not found");
  }

  return ok(profile);
});
