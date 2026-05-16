import { NextRequest } from "next/server";
import { z } from "zod";
import { requireStandardUser } from "@middleware/auth.middleware";
import { validateBody } from "@middleware/validate.middleware";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { optionsResponse, withCors } from "@utils/cors";
import {
  createPipelineRunLog,
  listPipelineRunHistory,
  runAnalysisPipeline,
} from "@modules/pipelines/analysisPipeline.service";

const runPipelineSchema = z.object({
  lookbackDays: z.coerce.number().int().min(7).max(365).default(30),
  minCategorySharePct: z.coerce.number().min(10).max(95).default(35),
  minRecurringCount: z.coerce.number().int().min(2).max(20).default(3),
  maxSuggestions: z.coerce.number().int().min(1).max(10).default(3),
  commitInsights: z.coerce.boolean().default(false),
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(50).default(10),
});

export const GET = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const query = validateBody(historyQuerySchema, {
    limit: req.nextUrl.searchParams.get("limit") || undefined,
  });

  const history = await listPipelineRunHistory(user.id, query.limit);
  return withCors(req, ok(history), "GET,POST,OPTIONS");
});

export const POST = asyncHandler(async (req: NextRequest) => {
  const user = await requireStandardUser(req);
  const payload = validateBody(runPipelineSchema, await req.json());
  const startedAtIso = new Date().toISOString();

  try {
    const result = await runAnalysisPipeline(user.id, payload);
    await createPipelineRunLog(user.id, payload, "success", startedAtIso, result);
    return withCors(req, ok(result), "GET,POST,OPTIONS");
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : "Pipeline execution failed";
    await createPipelineRunLog(user.id, payload, "failed", startedAtIso, undefined, errorMessage);
    throw error;
  }
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,POST,OPTIONS");
}
