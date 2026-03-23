/**
 * FinSight — Auth Routes
 */
import { Router } from "express";
import * as authController from "../controllers/auth.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { loginSchema, signupSchema } from "../utils/validation";
import { authLimiter } from "../middleware/rateLimit.middleware";

const router = Router();

// Public routes (rate limited)
router.post("/signup", authLimiter, validateBody(signupSchema), authController.signup);
router.post("/login", authLimiter, validateBody(loginSchema), authController.login);
router.post("/reset-password", authLimiter, authController.resetPassword);

// Protected routes
router.post("/logout", authenticate, authController.logout);
router.get("/profile", authenticate, authController.getProfile);
router.put("/profile", authenticate, authController.updateProfile);

export default router;
