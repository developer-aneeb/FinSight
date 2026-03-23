/**
 * FinSight — Transaction Routes
 */
import { Router } from "express";
import * as transactionController from "../controllers/transaction.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { transactionSchema } from "../utils/validation";

const router = Router();

// All routes require authentication
router.use(authenticate);

router.get("/", transactionController.listTransactions);
router.get("/summary/monthly", transactionController.getMonthlySummary);
router.get("/:id", transactionController.getTransaction);
router.post("/", validateBody(transactionSchema), transactionController.createTransaction);
router.put("/:id", validateBody(transactionSchema), transactionController.updateTransaction);
router.delete("/:id", transactionController.deleteTransaction);

export default router;
