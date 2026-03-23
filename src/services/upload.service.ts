/**
 * FinSight — Upload Service (Supabase Storage)
 */
import { getSupabaseServiceClient } from "../config/supabase";
import logger from "../utils/logger";
import { UPLOAD } from "../utils/constants";
import { ValidationError } from "../middleware/errorHandler.middleware";
import path from "path";
import { v4 as uuidv4 } from "uuid";

const BUCKET = "receipts";

/** Upload a receipt file to Supabase Storage */
export async function uploadReceipt(
  userId: string,
  file: Express.Multer.File
): Promise<{ url: string; filePath: string }> {
  // Validate file type
  if (!UPLOAD.ALLOWED_MIME_TYPES.includes(file.mimetype)) {
    throw new ValidationError(
      `Invalid file type: ${file.mimetype}. Allowed: ${UPLOAD.ALLOWED_MIME_TYPES.join(", ")}`
    );
  }

  // Validate file size
  if (file.size > UPLOAD.MAX_FILE_SIZE) {
    throw new ValidationError(
      `File too large. Maximum size: ${UPLOAD.MAX_FILE_SIZE / (1024 * 1024)}MB`
    );
  }

  const ext = path.extname(file.originalname) || ".jpg";
  const fileName = `${userId}/${uuidv4()}${ext}`;

  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(fileName, file.buffer, {
      contentType: file.mimetype,
      upsert: false,
    });

  if (error) {
    logger.error("Failed to upload receipt", { userId, error: error.message });
    throw error;
  }

  const { data: urlData } = supabase.storage
    .from(BUCKET)
    .getPublicUrl(fileName);

  logger.info("Receipt uploaded", { userId, filePath: fileName });

  return {
    url: urlData.publicUrl,
    filePath: fileName,
  };
}

/** Delete a receipt from Supabase Storage */
export async function deleteReceipt(filePath: string): Promise<void> {
  const supabase = getSupabaseServiceClient();

  const { error } = await supabase.storage.from(BUCKET).remove([filePath]);

  if (error) {
    logger.error("Failed to delete receipt", { filePath, error: error.message });
    throw error;
  }

  logger.info("Receipt deleted", { filePath });
}
