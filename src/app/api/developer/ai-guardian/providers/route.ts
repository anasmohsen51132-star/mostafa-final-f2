// src/app/api/developer/ai-guardian/providers/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, unauthorized, forbidden } from "@/lib/utils";
import { listProviders } from "@/lib/ai-guardian/providers/registry";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  return success({ providers: listProviders(), active: process.env.AI_GUARDIAN_PROVIDER || "claude" });
}
