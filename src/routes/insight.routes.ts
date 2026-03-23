/**
 * FinSight — Insight Routes
 */
import { Router } from "express";
import * as insightController from "../controllers/insight.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", insightController.listInsights);
router.patch("/:id/dismiss", insightController.dismissInsight);

export default router;
