import { NextResponse } from "next/server";
import { handleRouteError } from "@utils/apiResponse";

export function errorHandler(error: unknown): NextResponse {
  return handleRouteError(error);
}
