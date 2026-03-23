/**
 * FinSight — Analytics Routes
 */
import { Router } from "express";
import * as analyticsController from "../controllers/analytics.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/dashboard", analyticsController.getDashboard);
router.get("/detailed", analyticsController.getDetailedAnalytics);

export default router;
