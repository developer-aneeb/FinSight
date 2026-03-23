/**
 * FinSight — Constants (Backend)
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export const BUDGET_THRESHOLDS = {
  WARNING: 0.75,
  DANGER: 0.9,
  EXCEEDED: 1.0,
};

export const UPLOAD = {
  MAX_FILE_SIZE: 5 * 1024 * 1024, // 5 MB
  ALLOWED_MIME_TYPES: [
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
  ],
  BUCKET_NAME: "receipts",
};

export const API_PREFIX = "/api/v1";
