/**
 * FinSight — Next.js Root Middleware
 * Handles security headers.
 * Auth protection is handled client-side via the authenticated layout guard.
 * Token validation is done server-side by the Express backend.
 */
import { NextRequest, NextResponse } from "next/server";

export async function middleware(_req: NextRequest) {
  const response = NextResponse.next();

  // ─── Security Headers ───────────────────────────────────
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set(
    "Strict-Transport-Security",
    "max-age=31536000; includeSubDomains"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
