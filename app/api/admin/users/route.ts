import { NextRequest } from "next/server";
import { requireAdminUser } from "@middleware/auth.middleware";
import { listUsers } from "@modules/users/user.service";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";

export const GET = asyncHandler(async (req: NextRequest) => {
  await requireAdminUser(req);

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 20);

  const result = await listUsers(page, pageSize);
  return ok(result);
});
