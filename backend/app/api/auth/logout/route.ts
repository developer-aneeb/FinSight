import { NextRequest } from "next/server";
import { signOut } from "@modules/auth/auth.service";
import { clearAccessTokenCookie } from "@modules/auth/tokens";
import { asyncHandler } from "@utils/asyncHandler";
import { message } from "@utils/apiResponse";

export const POST = asyncHandler(async (req: NextRequest) => {
  const authHeader = req.headers.get("authorization") || "";
  const token = authHeader.replace("Bearer ", "");

  if (token) {
    await signOut(token);
  }

  const response = message("Logged out successfully");
  clearAccessTokenCookie(response);
  return response;
});
