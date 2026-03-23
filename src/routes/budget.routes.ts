/**
 * FinSight — Budget Routes
 */
import { Router } from "express";
import * as budgetController from "../controllers/budget.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { budgetSchema } from "../utils/validation";

const router = Router();

router.use(authenticate);

router.get("/", budgetController.listBudgets);
router.get("/active", budgetController.getActiveBudgets);
router.get("/:id", budgetController.getBudget);
router.post("/", validateBody(budgetSchema), budgetController.createBudget);
router.put("/:id", validateBody(budgetSchema), budgetController.updateBudget);
router.delete("/:id", budgetController.deleteBudget);

export default router;
