import { NextRequest } from "next/server";
import { requireAdminUser } from "@middleware/auth.middleware";
import { getDashboardStats } from "@modules/admin/admin.service";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";

export const GET = asyncHandler(async (req: NextRequest) => {
  await requireAdminUser(req);
  const stats = await getDashboardStats();
  return ok(stats);
});
