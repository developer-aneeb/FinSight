import { signUp } from "@modules/auth/auth.service";
import { asyncHandler } from "@utils/asyncHandler";
import { created } from "@utils/apiResponse";
import { validateBody } from "@middleware/validate.middleware";
import { z } from "zod";

const signupSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  full_name: z.string().min(1),
});

export const POST = asyncHandler(async (req: Request) => {
  const body = validateBody(signupSchema, await req.json());
  const data = await signUp(body);
  return created(data);
});
