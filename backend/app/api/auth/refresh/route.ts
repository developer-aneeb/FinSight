import { refreshSession } from "@modules/auth/auth.service";
import { setAccessTokenCookie } from "@modules/auth/tokens";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { validateBody } from "@middleware/validate.middleware";
import { refreshSchema } from "@modules/auth/auth.validation";

export const POST = asyncHandler(async (req: Request) => {
  const body = validateBody(refreshSchema, await req.json());
  const data = await refreshSession(body.refresh_token);

  const response = ok(data);
  if (data.session?.access_token) {
    setAccessTokenCookie(response, data.session.access_token);
  }

  return response;
});
