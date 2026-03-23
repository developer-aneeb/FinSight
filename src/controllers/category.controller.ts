/**
 * FinSight — Category Controller
 */
import { Response, NextFunction } from "express";
import { AuthenticatedRequest } from "../types";
import * as categoryService from "../services/category.service";
import { sendSuccess, sendCreated, sendMessage } from "../helpers/response.helper";

/** GET /categories */
export async function listCategories(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const categories = await categoryService.listCategories(userId);
    sendSuccess(res, categories);
  } catch (err) {
    next(err);
  }
}

/** POST /categories */
export async function createCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const category = await categoryService.createCategory(userId, req.body);
    sendCreated(res, category);
  } catch (err) {
    next(err);
  }
}

/** PUT /categories/:id */
export async function updateCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const category = await categoryService.updateCategory(userId, req.params.id, req.body);
    sendSuccess(res, category);
  } catch (err) {
    next(err);
  }
}

/** DELETE /categories/:id */
export async function deleteCategory(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    await categoryService.deleteCategory(userId, req.params.id);
    sendMessage(res, "Category deleted");
  } catch (err) {
    next(err);
  }
}

/** GET /tags */
export async function listTags(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const tags = await categoryService.listTags(userId);
    sendSuccess(res, tags);
  } catch (err) {
    next(err);
  }
}

/** POST /tags */
export async function createTag(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    const tag = await categoryService.createTag(userId, req.body);
    sendCreated(res, tag);
  } catch (err) {
    next(err);
  }
}

/** DELETE /tags/:id */
export async function deleteTag(req: AuthenticatedRequest, res: Response, next: NextFunction): Promise<void> {
  try {
    const userId = req.user!.id;
    await categoryService.deleteTag(userId, req.params.id);
    sendMessage(res, "Tag deleted");
  } catch (err) {
    next(err);
  }
}
