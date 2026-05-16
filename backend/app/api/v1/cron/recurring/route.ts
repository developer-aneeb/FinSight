import { NextRequest } from "next/server";
import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";
import { withCors, optionsResponse } from "@utils/cors";
import { processDueRecurringTransactionsForAllUsers } from "@modules/transactions/transactions.service";
import { HttpError } from "@utils/error";

function assertCronSecret(req: NextRequest): void {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    throw new HttpError(500, "CRON_SECRET is not configured");
  }

  const actual = req.headers.get("x-cron-secret");
  if (!actual || actual !== expected) {
    throw new HttpError(401, "Unauthorized cron invocation");
  }
}

export const POST = asyncHandler(async (req: NextRequest) => {
  assertCronSecret(req);
  const result = await processDueRecurringTransactionsForAllUsers();
  return withCors(req, ok(result), "POST,OPTIONS");
});

export function OPTIONS(req: Request) {
  return optionsResponse(req, "POST,OPTIONS");
}
