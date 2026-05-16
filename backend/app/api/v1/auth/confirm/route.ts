import { GET as legacyGET } from "../../../auth/confirm/route";
import { optionsResponse, withCors } from "@utils/cors";

export async function GET(req: Request) {
  const response = await legacyGET(req);
  return withCors(req, response, "GET,OPTIONS");
}

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,OPTIONS");
}
