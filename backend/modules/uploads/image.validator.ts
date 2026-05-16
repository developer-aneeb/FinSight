import { HttpError } from "@utils/error";

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024;

export function validateUploadFile(file: File): void {
  if (!ALLOWED_MIME_TYPES.includes(file.type)) {
    throw new HttpError(400, "Unsupported file type");
  }

  if (file.size > MAX_FILE_SIZE) {
    throw new HttpError(400, "File size exceeds 5MB limit");
  }
}
