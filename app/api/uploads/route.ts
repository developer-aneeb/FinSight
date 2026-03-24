import { NextRequest } from "next/server";
import { requireUser } from "@middleware/auth.middleware";
import { validateUploadFile } from "@modules/uploads/image.validator";
import { uploadFile, deleteFile } from "@modules/uploads/upload.service";
import { asyncHandler } from "@utils/asyncHandler";
import { ok, message } from "@utils/apiResponse";
import { HttpError } from "@utils/error";

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireUser(req);
  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    throw new HttpError(400, "file is required");
  }

  validateUploadFile(file);
  const result = await uploadFile(user.id, file);
  return ok(result);
});

export const DELETE = asyncHandler(async (req: NextRequest) => {
  await requireUser(req);

  const url = new URL(req.url);
  const filePath = url.searchParams.get("path") || "";

  if (!filePath) {
    throw new HttpError(400, "path is required");
  }

  await deleteFile(filePath);
  return message("File deleted successfully");
});
