/**
 * FinSight — Admin Routes
 */
import { Router } from "express";
import * as adminController from "../controllers/admin.controller";
import { authenticate, requireAdmin } from "../middleware/auth.middleware";

const router = Router();

// All admin routes require authentication + admin role
router.use(authenticate, requireAdmin);

router.get("/users", adminController.listUsers);
router.get("/stats", adminController.getStats);

export default router;
