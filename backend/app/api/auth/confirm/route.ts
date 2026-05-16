import { confirmSignup } from "@modules/auth/auth.service";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { HttpError } from "@utils/error";

export const GET = asyncHandler(async (req: Request) => {
  const url = new URL(req.url);
  const tokenHash = url.searchParams.get("token_hash") || "";

  if (!tokenHash) {
    throw new HttpError(400, "token_hash is required");
  }

  const data = await confirmSignup(tokenHash);
  return ok(data);
});
