import env from "@config/env";
import { resetPassword } from "@modules/auth/auth.service";
import { asyncHandler } from "@utils/asyncHandler";
import { message } from "@utils/apiResponse";
import { validateBody } from "@middleware/validate.middleware";
import { forgotPasswordSchema } from "@modules/auth/auth.validation";

export const POST = asyncHandler(async (req: Request) => {
  const body = validateBody(forgotPasswordSchema, await req.json());
  const redirectTo = body.redirectTo || `${env.frontendUrl}/reset-password`;

  await resetPassword(body.email, redirectTo);
  return message("Password reset email sent");
});





