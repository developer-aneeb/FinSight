import { NextResponse } from "next/server";
import { handleRouteError } from "./apiResponse";

export function asyncHandler<TArgs extends unknown[]>(
  handler: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs): Promise<NextResponse> => {
    try {
      return await handler(...args);
    } catch (error) {
      return handleRouteError(error);
    }
  };
}
