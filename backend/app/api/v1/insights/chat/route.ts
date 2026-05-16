import { NextRequest } from "next/server";
import { z } from "zod";
import { requireStandardUser } from "@middleware/auth.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import { validateBody } from "@middleware/validate.middleware";
import { chatWithFinanceAssistant } from "@modules/insights/insights.service";

const chatSchema = z.object({
  message: z.string().trim().min(1).max(1000),
  history: z
    .array(
      z.object({
        role: z.enum(["user", "assistant"]),
        content: z.string().trim().min(1).max(2000),
      })
    )
    .max(20)
    .optional(),
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const body = await req.json();
  const payload = validateBody(chatSchema, body);

  const data = await chatWithFinanceAssistant(user.id, payload.message, payload.history ?? []);
  return withCors(req, ok(data), "POST,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "POST,OPTIONS");
}
