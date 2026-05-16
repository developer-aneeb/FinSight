import { POST as legacyPOST } from "../../../auth/logout/route";
import { optionsResponse, withCors } from "@utils/cors";
import { NextRequest } from "next/server";

export async function POST(req: NextRequest) {
  const response = await legacyPOST(req);
  return withCors(req, response, "POST,OPTIONS");
}

export function OPTIONS(req: Request) {
  return optionsResponse(req, "POST,OPTIONS");
}
