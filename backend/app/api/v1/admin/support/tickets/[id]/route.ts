import { PATCH as legacyPATCH } from "../../../../../admin/support/tickets/[id]/route";
import { NextRequest } from "next/server";
import { optionsResponse, withCors } from "@utils/cors";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const response = await legacyPATCH(req, ctx);
  return withCors(req, response, "PATCH,OPTIONS");
}

export function OPTIONS(req: Request) {
  return optionsResponse(req, "PATCH,OPTIONS");
}
