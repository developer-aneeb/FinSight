import { NextRequest } from "next/server";
import { optionsResponse } from "@utils/cors";
import { requireAdminUser } from "@middleware/auth.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { runGlobalAnalysisPipeline } from "@modules/pipelines/pipelines.service";

export const POST = asyncHandler(async (req: NextRequest) => {
  await requireAdminUser(req);

  // Trigger the global analysis pipeline (non-blocking to the caller would be ideal,
  // but for admin manual trigger we run the pipeline and return the result.)
  const result = await runGlobalAnalysisPipeline();
  return ok(result);
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "POST,OPTIONS");
}
