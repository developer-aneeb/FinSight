import { NextRequest, NextResponse } from "next/server";

export function getBearerToken(req: NextRequest): string {
  const authHeader = req.headers.get("authorization") || "";
  if (authHeader.startsWith("Bearer ")) {
    return authHeader.slice("Bearer ".length).trim();
  }

  return req.cookies.get("sb-access-token")?.value || "";
}

export function setAccessTokenCookie(response: NextResponse, accessToken: string): void {
  response.cookies.set("sb-access-token", accessToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 7,
    path: "/",
  });
}

export function clearAccessTokenCookie(response: NextResponse): void {
  response.cookies.set("sb-access-token", "", {
    path: "/",
    maxAge: 0,
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
  });
}
