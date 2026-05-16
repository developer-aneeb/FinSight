import { asyncHandler } from "@utils/asyncHandler";
import { ok } from "@utils/apiResponse";

export const GET = asyncHandler(async () => {
  return ok({ status: "ok", service: "finsight-backend" });
});
