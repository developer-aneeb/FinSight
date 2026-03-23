/**
 * FinSight — Pagination Helper
 */
import { Request } from "express";
import { DEFAULT_PAGE_SIZE, MAX_PAGE_SIZE } from "../utils/constants";

export interface PaginationParams {
  page: number;
  pageSize: number;
  offset: number;
}

/** Parse page & pageSize from query string */
export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const pageSize = Math.min(
    MAX_PAGE_SIZE,
    Math.max(1, parseInt(req.query.pageSize as string, 10) || DEFAULT_PAGE_SIZE)
  );
  return {
    page,
    pageSize,
    offset: (page - 1) * pageSize,
  };
}
