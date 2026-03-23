/**
 * FinSight — Alert Routes
 */
import { Router } from "express";
import * as alertController from "../controllers/alert.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", alertController.listAlerts);
router.patch("/read-all", alertController.markAllRead);
router.patch("/:id", alertController.updateAlertStatus);

export default router;
