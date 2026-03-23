/**
 * FinSight — Upload Routes
 */
import { Router } from "express";
import multer from "multer";
import * as uploadController from "../controllers/upload.controller";
import { authenticate } from "../middleware/auth.middleware";
import { uploadLimiter } from "../middleware/rateLimit.middleware";
import { UPLOAD } from "../utils/constants";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: UPLOAD.MAX_FILE_SIZE },
});

const router = Router();

router.use(authenticate);

router.post("/receipt", uploadLimiter, upload.single("file"), uploadController.uploadReceipt);
router.delete("/receipt", uploadController.deleteReceipt);

export default router;
