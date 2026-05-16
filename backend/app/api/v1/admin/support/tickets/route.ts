import { GET as legacyGET } from "../../../../admin/support/tickets/route";
import { NextRequest } from "next/server";
import { optionsResponse, withCors } from "@utils/cors";

export async function GET(req: NextRequest) {
  const response = await legacyGET(req);
  return withCors(req, response, "GET,OPTIONS");
}

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,OPTIONS");
}
