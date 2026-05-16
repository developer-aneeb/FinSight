import { NextRequest } from "next/server";
import { requireAdminUser } from "@middleware/auth.middleware";
import { listAdminNotifications } from "@modules/admin/admin.service";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";

export const GET = asyncHandler(async (req: NextRequest) => {
  await requireAdminUser(req);

  const url = new URL(req.url);
  const limit = Number(url.searchParams.get("limit") || 20);
  const safeLimit = Number.isFinite(limit) ? Math.min(Math.max(limit, 1), 100) : 20;

  const notifications = await listAdminNotifications(safeLimit);
  return ok(notifications);
});
