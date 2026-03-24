import { refreshSession } from "@modules/auth/auth.service";
import { setAccessTokenCookie } from "@modules/auth/tokens";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { validateBody } from "@middleware/validate.middleware";
import { z } from "zod";

const refreshSchema = z.object({
  refresh_token: z.string().min(1),
});

export const POST = asyncHandler(async (req: Request) => {
  const body = validateBody(refreshSchema, await req.json());
  const data = await refreshSession(body.refresh_token);

  const response = ok(data);
  if (data.session?.access_token) {
    setAccessTokenCookie(response, data.session.access_token);
  }

  return response;
});
