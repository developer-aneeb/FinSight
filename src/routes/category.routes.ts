/**
 * FinSight — Category & Tag Routes
 */
import { Router } from "express";
import * as categoryController from "../controllers/category.controller";
import { authenticate } from "../middleware/auth.middleware";
import { validateBody } from "../middleware/validation.middleware";
import { categorySchema, tagSchema } from "../utils/validation";

const router = Router();

router.use(authenticate);

// Categories
router.get("/", categoryController.listCategories);
router.post("/", validateBody(categorySchema), categoryController.createCategory);
router.put("/:id", validateBody(categorySchema), categoryController.updateCategory);
router.delete("/:id", categoryController.deleteCategory);

// Tags (nested under /categories/tags)
router.get("/tags", categoryController.listTags);
router.post("/tags", validateBody(tagSchema), categoryController.createTag);
router.delete("/tags/:id", categoryController.deleteTag);

export default router;
