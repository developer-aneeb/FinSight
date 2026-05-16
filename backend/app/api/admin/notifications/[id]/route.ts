import { NextRequest } from "next/server";
import { requireAdminUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { getAdminClient } from "@config/supabaseAdminClient";
import { asyncHandler } from "@utils/asyncHandler";
import { HttpError } from "@utils/error";
import { ok } from "@utils/apiResponse";
import { z } from "zod";

const updateAlertSchema = z.object({
  status: z.enum(["unread", "read", "dismissed"]),
});

export const PATCH = asyncHandler(async (req: NextRequest, { params }: { params: Promise<{ id: string }> }) => {
  await requireAdminUser(req);
  const { status } = validateBody(updateAlertSchema, await req.json());
  const { id } = await params;

  const supabase = getAdminClient();
  const { data, error } = await supabase
    .from("alerts")
    .update({ status })
    .eq("id", id)
    .select("*, user:users(email, full_name)")
    .single();

  if (error || !data) {
    throw new HttpError(404, "Notification not found");
  }

  const user = (data.user || {}) as { email?: string; full_name?: string };
  
  return ok({
    id: String(data.id || ""),
    user_id: String(data.user_id || ""),
    user_email: user.email || "Unknown",
    user_full_name: user.full_name || "",
    title: String(data.title || ""),
    message: String(data.message || ""),
    severity: data.severity || "info",
    status: data.status || "unread",
    created_at: String(data.created_at || ""),
  });
});
