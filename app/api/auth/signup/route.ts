import { signUp } from "@modules/auth/auth.service";
import { asyncHandler } from "@utils/asyncHandler";
import { created } from "@utils/apiResponse";
import { validateBody } from "@middleware/validate.middleware";
import { signupSchema } from "@modules/auth/auth.validation";

export const POST = asyncHandler(async (req: Request) => {
  const body = validateBody(signupSchema, await req.json());
  const data = await signUp(body);
  return created(data);
});
