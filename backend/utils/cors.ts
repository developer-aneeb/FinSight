import { NextResponse } from "next/server";
import env from "@config/env";

const DEFAULT_METHODS = "GET,POST,PUT,PATCH,DELETE,OPTIONS";

function resolveOrigin(req: Request): string {
  return req.headers.get("origin") || env.frontendUrl || "http://localhost:5173";
}

export function buildCorsHeaders(req: Request, methods = DEFAULT_METHODS): Record<string, string> {
  return {
    "Access-Control-Allow-Origin": resolveOrigin(req),
    "Access-Control-Allow-Methods": methods,
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
    Vary: "Origin",
  };
}

export function withCors(req: Request, response: NextResponse, methods = DEFAULT_METHODS): NextResponse {
  const headers = buildCorsHeaders(req, methods);

  Object.entries(headers).forEach(([key, value]) => {
    response.headers.set(key, value);
  });

  return response;
}

export function optionsResponse(req: Request, methods = DEFAULT_METHODS): NextResponse {
  return new NextResponse(null, {
    status: 204,
    headers: buildCorsHeaders(req, methods),
  });
}
