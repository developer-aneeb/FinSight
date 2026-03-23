/**
 * FinSight — Central Route Aggregator
 *
 * All API routes are registered here under the /api/v1 prefix.
 */
import { Router } from "express";
import { API_PREFIX } from "./utils/constants";

// Route modules
import authRoutes from "./routes/auth.routes";
import transactionRoutes from "./routes/transaction.routes";
import budgetRoutes from "./routes/budget.routes";
import categoryRoutes from "./routes/category.routes";
import analyticsRoutes from "./routes/analytics.routes";
import alertRoutes from "./routes/alert.routes";
import insightRoutes from "./routes/insight.routes";
import searchRoutes from "./routes/search.routes";
import uploadRoutes from "./routes/upload.routes";
import adminRoutes from "./routes/admin.routes";

const router = Router();

// Health check (no auth required)
router.get("/health", (_req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// Mount route modules
router.use("/auth", authRoutes);
router.use("/transactions", transactionRoutes);
router.use("/budgets", budgetRoutes);
router.use("/categories", categoryRoutes);
router.use("/analytics", analyticsRoutes);
router.use("/alerts", alertRoutes);
router.use("/insights", insightRoutes);
router.use("/search", searchRoutes);
router.use("/upload", uploadRoutes);
router.use("/admin", adminRoutes);

export { router, API_PREFIX };
