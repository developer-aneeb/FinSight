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
  email: z.string().email().optional(),
  full_name: z.string().trim().min(1).max(120).optional(),
  role: z.enum(["user", "admin"]).optional(),
  is_active: z.boolean().optional(),
});

const deleteUserSchema = z.object({
  userId: z.string().uuid(),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  await requireAdminUser(req);

  const url = new URL(req.url);
  const page = Number(url.searchParams.get("page") || 1);
  const pageSize = Number(url.searchParams.get("pageSize") || 20);

  const result = await listUsers(page, pageSize);
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
  const body = validateBody(updateUserSchema, await req.json());

  if (adminUser.id === body.userId && body.role !== undefined && body.role !== "admin") {
    throw new HttpError(400, "You cannot remove your own admin access");
  }

  const user = await updateUserByAdmin(body.userId, {
    email: body.email,
    full_name: body.full_name,
    role: body.role,
    is_active: body.is_active,
  });

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
