import { NextResponse } from "next/server";
import { ZodError } from "zod";
import { HttpError } from "./error";

export { HttpError };

export function ok<T>(data: T, init?: ResponseInit): NextResponse {
  return NextResponse.json({ success: true, data }, init);
}

export function created<T>(data: T): NextResponse {
  return NextResponse.json({ success: true, data }, { status: 201 });
}

export function message(text: string, status = 200): NextResponse {
  return NextResponse.json({ success: true, message: text }, { status });
}

export function fail(error: string, status = 500, details?: unknown): NextResponse {
  return NextResponse.json({ success: false, error, details }, { status });
}

export function handleRouteError(error: unknown): NextResponse {
  if (error instanceof HttpError) {
    return fail(error.message, error.statusCode, error.details);
  }

  if (error instanceof ZodError) {
    const messages = error.issues.map((entry) => `${entry.path.join(".")}: ${entry.message}`);
    return fail("Validation failed", 400, messages);
  }

  if (error && typeof error === "object" && "code" in error) {
    const dbError = error as { message?: string };
    return fail(dbError.message || "Database operation failed", 500);
  }

  const err = error as Error;
  return fail(err?.message || "Internal server error", 500);
}
