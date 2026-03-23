/**
 * FinSight — Search Routes
 */
import { Router } from "express";
import * as searchController from "../controllers/search.controller";
import { authenticate } from "../middleware/auth.middleware";

const router = Router();

router.use(authenticate);

router.get("/", searchController.searchTransactions);

export default router;
