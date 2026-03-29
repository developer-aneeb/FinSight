import { DELETE as legacyDELETE, GET as legacyGET, PATCH as legacyPATCH, POST as legacyPOST } from "../../../admin/users/route";
import { optionsResponse, withCors } from "@utils/cors";
import { NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  const response = await legacyGET(req);
  return withCors(req, response, "GET,POST,PATCH,DELETE,OPTIONS");
}

export async function POST(req: NextRequest) {
  const response = await legacyPOST(req);
  return withCors(req, response, "GET,POST,PATCH,DELETE,OPTIONS");
}

export async function PATCH(req: NextRequest) {
  const response = await legacyPATCH(req);
  return withCors(req, response, "GET,POST,PATCH,DELETE,OPTIONS");
}

export async function DELETE(req: NextRequest) {
  const response = await legacyDELETE(req);
  return withCors(req, response, "GET,POST,PATCH,DELETE,OPTIONS");
}

export function OPTIONS(req: Request) {
  return optionsResponse(req, "GET,POST,PATCH,DELETE,OPTIONS");
}
