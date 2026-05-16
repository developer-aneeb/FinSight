import { POST as legacyPOST } from "../../../auth/forgot-password/route";
import { optionsResponse, withCors } from "@utils/cors";

export async function POST(req: Request) {
  const response = await legacyPOST(req);
  return withCors(req, response, "POST,OPTIONS");
}

export function OPTIONS(req: Request) {
  return optionsResponse(req, "POST,OPTIONS");
}
