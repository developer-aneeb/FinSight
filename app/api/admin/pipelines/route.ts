import { NextRequest } from "next/server";
import { requireAdminUser } from "@middleware/auth.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { runGlobalAnalysisPipeline } from "@modules/pipelines/pipelines.service";

/**
 * Trigger Global AI Analysis Pipeline
 * POST /api/admin/pipelines
 */
export const POST = asyncHandler(async (req: NextRequest) => {
  await requireAdminUser(req);
  
  // Note: in a true serverless edge environment like Vercel, this might timeout if it takes > 10s-60s
  // In a robust implementation, this would queue a job (e.g. AWS SQS, bullmq) or use Edge Functions limits
  // For MVP, we run it immediately and return the result.
  const result = await runGlobalAnalysisPipeline();
  
  return ok({
    message: "Global AI Analysis Pipeline completed successfully",
    ...result
  });
});
