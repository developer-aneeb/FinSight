/**
 * FinSight — Response Helpers
 * Consistent JSON response builders for Express
 */
import { Response } from "express";
import { ApiResponse, PaginatedResponse } from "../types";

/** Send a success response */
export function sendSuccess<T>(res: Response, data: T, statusCode = 200): void {
  const response: ApiResponse<T> = { success: true, data };
  res.status(statusCode).json(response);
}

/** Send a created response (201) */
export function sendCreated<T>(res: Response, data: T): void {
  sendSuccess(res, data, 201);
}

/** Send a paginated success response */
export function sendPaginated<T>(
  res: Response,
  data: T[],
  total: number,
  page: number,
  pageSize: number
): void {
  const response: PaginatedResponse<T> = {
    success: true,
    data,
    total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
  res.status(200).json(response);
}

/** Send a message-only response */
export function sendMessage(res: Response, message: string, statusCode = 200): void {
  res.status(statusCode).json({ success: true, message });
}

/** Send an error response */
export function sendError(res: Response, message: string, statusCode = 500): void {
  const response: ApiResponse = { success: false, error: message };
  res.status(statusCode).json(response);
}
