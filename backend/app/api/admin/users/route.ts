import { NextRequest } from "next/server";
import { requireAdminUser } from "@middleware/auth.middleware";
import { createUserByAdmin, deleteUserByAdmin, listUsers, updateUserByAdmin } from "@modules/users/user.service";
import { asyncHandler } from "@utils/asyncHandler";
import { created, message, ok } from "@utils/apiResponse";
import { HttpError } from "@utils/error";
import { validateBody } from "@middleware/validate.middleware";
import { z } from "zod";

const createUserSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().trim().min(1).max(120),
  role: z.enum(["user", "admin"]).default("user"),
});

const updateUserSchema = z.object({
  userId: z.string().uuid(),
  // email and full_name are intentionally excluded: admins are not allowed
  // to modify those fields via this API. Only role and is_active are mutable.
  role: z.enum(["user", "admin"]).optional(),
  is_active: z.boolean().optional(),
});

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await requireAdminUser(req);

  const url = new URL(req.url);
  const pageRaw = Number(url.searchParams.get("page") || 1);
  const pageSizeRaw = Number(url.searchParams.get("pageSize") || 20);
  const search = (url.searchParams.get("search") || "").trim() || undefined;

  const page = Number.isFinite(pageRaw) && pageRaw > 0 ? Math.floor(pageRaw) : 1;
  const pageSize = Number.isFinite(pageSizeRaw) && pageSizeRaw > 0
    ? Math.min(Math.floor(pageSizeRaw), 100)
    : 20;

  const result = await listUsers(page, pageSize, search);
  return ok(result);
});

export const POST = asyncHandler(async (req: NextRequest) => {
  await requireAdminUser(req);
  const body = validateBody(createUserSchema, await req.json());

  const user = await createUserByAdmin({
    email: body.email,
    password: body.password,
    full_name: body.full_name,
    role: body.role,
  });

  return created(user);
});

export const PATCH = asyncHandler(async (req: NextRequest) => {
  const adminUser = await requireAdminUser(req);
  const raw = await req.json();

  // Prevent admins from attempting to change immutable fields
  if (raw.email !== undefined || raw.full_name !== undefined) {
    throw new HttpError(400, "Modifying email or full name is not allowed");
  }

  const body = validateBody(updateUserSchema, raw);

  if (adminUser.id === body.userId && body.role !== undefined && body.role !== "admin") {
    throw new HttpError(400, "You cannot remove your own admin access");
  }

  // Only pass allowed fields to service
  const updates: Record<string, unknown> = {};
  if (body.role !== undefined) updates.role = body.role;
  if (body.is_active !== undefined) updates.is_active = body.is_active;

  const user = await updateUserByAdmin(body.userId, updates as any);

  return ok(user);
});

export const DELETE = asyncHandler(async (req: NextRequest) => {
  const adminUser = await requireAdminUser(req);
  const body = validateBody(deleteUserSchema, await req.json());

  if (adminUser.id === body.userId) {
    throw new HttpError(400, "You cannot delete your own admin account");
  }

  await deleteUserByAdmin(body.userId);
  return message("User deleted successfully");
});
