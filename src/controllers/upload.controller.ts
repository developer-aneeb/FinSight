/**
 * FinSight — Upload Controller
 */
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import * as uploadService from "../services/upload.service";
import { sendCreated, sendMessage } from "../helpers/response.helper";
import { ValidationError } from "../middleware/errorHandler.middleware";

/** POST /upload/receipt */
export async function uploadReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;

    if (!req.file) {
      throw new ValidationError("No file uploaded");
    }

    const result = await uploadService.uploadReceipt(userId, req.file);
    sendCreated(res, result);
  } catch (err) {
    next(err);
  }
}

/** DELETE /upload/receipt */
export async function deleteReceipt(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const { filePath } = req.body;

    if (!filePath) {
      throw new ValidationError("filePath is required");
    }

    await uploadService.deleteReceipt(filePath);
    sendMessage(res, "Receipt deleted");
  } catch (err) {
    next(err);
  }
}
