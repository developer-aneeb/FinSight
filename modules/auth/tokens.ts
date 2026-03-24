import { NextRequest, NextResponse } from "next/server";

export function getBearerToken(req: NextRequest): string {
  return req.headers.get("authorization")?.replace("Bearer ", "") || "";
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
