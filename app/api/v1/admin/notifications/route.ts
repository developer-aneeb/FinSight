import { GET as legacyGET } from "../../../admin/notifications/route";
import { optionsResponse, withCors } from "@utils/cors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const response = await legacyGET(req);
  return withCors(req, response, "GET,OPTIONS");
}

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,OPTIONS");
}
