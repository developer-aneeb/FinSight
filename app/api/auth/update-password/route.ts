import { updatePassword } from "@modules/auth/auth.service";
import { updatePasswordSchema } from "@modules/auth/auth.validation";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { message } from "@utils/apiResponse";
import { HttpError } from "@utils/error";

export const POST = asyncHandler(async (req: Request) => {
  const token = req.headers.get("authorization")?.replace("Bearer ", "") || "";

  if (!token) {
    throw new HttpError(401, "Authentication required");
  }

  const body = validateBody(updatePasswordSchema, await req.json());
  await updatePassword(token, body.password);

  return message("Password updated successfully");
});
