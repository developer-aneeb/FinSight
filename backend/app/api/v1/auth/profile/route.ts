import { GET as legacyGET, PATCH as legacyPATCH } from "../../../auth/profile/route";
import { optionsResponse, withCors } from "@utils/cors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const response = await legacyGET(req);
  return withCors(req, response, "GET,OPTIONS");
}

export async function PATCH(req: NextRequest) {
  const response = await legacyPATCH(req);
  return withCors(req, response, "PATCH,OPTIONS");
}

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,PATCH,OPTIONS");
}
