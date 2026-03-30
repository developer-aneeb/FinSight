/**
 * FinSight — API Client Helper
 * Centralized fetch wrapper for all client-side API calls
 */
import { useAuthStore } from "@/store/authStore";
import type { ApiResponse } from "@/types";

const BASE_URL = process.env.NEXT_PUBLIC_API_URL;

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.status = status;
    this.name = "ApiError";
  }
}

/** Fetch wrapper that auto-attaches auth token */
async function apiFetch<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  if (!BASE_URL) {
    throw new ApiError(500, "NEXT_PUBLIC_API_URL is not configured");
  }

  const token = useAuthStore.getState().accessToken;

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(options.headers as Record<string, string>),
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(`${BASE_URL}${endpoint}`, {
    ...options,
    headers,
    credentials: "include",
  });

  let data: any = {};
  try {
    data = await response.json();
  } catch {
    data = {};
  }

  if (!response.ok) {
    const details = Array.isArray(data?.details)
      ? data.details
          .map((entry: unknown) => {
            if (typeof entry === "string") {
              return entry;
            }
            if (entry && typeof entry === "object" && "message" in entry) {
              return String((entry as { message: unknown }).message);
            }
            return "";
          })
          .filter(Boolean)
          .join(", ")
      : "";

    const message = details || data.error || data.message || "Request failed";

    if (response.status === 401) {
      useAuthStore.getState().logout();
    }

    throw new ApiError(response.status, message);
  }

  return data;
}

/** GET request */
export function apiGet<T>(
  endpoint: string,
  params?: Record<string, string | number | undefined>
): Promise<ApiResponse<T>> {
  let url = endpoint;
  if (params) {
    const searchParams = new URLSearchParams();
    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined) searchParams.set(key, String(value));
    });
    const qs = searchParams.toString();
    if (qs) url += (url.includes("?") ? "&" : "?") + qs;
  }
  return apiFetch<T>(url);
}

/** POST request */
export function apiPost<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: "POST",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** PUT request */
export function apiPut<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: "PUT",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** DELETE request */
export function apiDelete<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: "DELETE",
    body: body ? JSON.stringify(body) : undefined,
  });
}

/** PATCH request */
export function apiPatch<T>(
  endpoint: string,
  body?: unknown
): Promise<ApiResponse<T>> {
  return apiFetch<T>(endpoint, {
    method: "PATCH",
    body: body ? JSON.stringify(body) : undefined,
  });
}
