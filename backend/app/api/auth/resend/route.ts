import { resendSignupConfirmation } from "@modules/auth/auth.service";
import { asyncHandler } from "@utils/asyncHandler";
import { message } from "@utils/apiResponse";
import { validateBody } from "@middleware/validate.middleware";
import { resendSchema } from "@modules/auth/auth.validation";

export const POST = asyncHandler(async (req: Request) => {
  const body = validateBody(resendSchema, await req.json());
  await resendSignupConfirmation(body.email);
  return message("Confirmation email resent");
});
