import { NextRequest, NextResponse } from "next/server";

function resolveOrigin(req: NextRequest): string {
  return req.headers.get("origin") || process.env.FRONTEND_URL || "http://localhost:5173";
}

function applyCors(req: NextRequest, res: NextResponse): NextResponse {
  res.headers.set("Access-Control-Allow-Origin", resolveOrigin(req));
  res.headers.set("Access-Control-Allow-Credentials", "true");
  res.headers.set("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.headers.set("Vary", "Origin");
  return res;
}

export function middleware(req: NextRequest) {
  if (req.method === "OPTIONS") {
    return applyCors(req, new NextResponse(null, { status: 204 }));
  }

  return applyCors(req, NextResponse.next());
}

export const config = {
  matcher: ["/api/v1/:path*"],
};
