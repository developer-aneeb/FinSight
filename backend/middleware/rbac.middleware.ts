import { NextRequest } from "next/server";
import { HttpError } from "@utils/error";
import { requireUser } from "./auth.middleware";

export async function requireRole(req: NextRequest, allowedRoles: string[]): Promise<void> {
  const user = await requireUser(req);

  if (!allowedRoles.includes(user.role)) {
    throw new HttpError(403, "Insufficient permissions");
  }
}
