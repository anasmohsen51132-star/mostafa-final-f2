// src/app/api/developer/config-validator/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { runConfigValidation } from "@/lib/config-validator/checks";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const checks = runConfigValidation();
    return success({ checks });
  } catch (e) {
    console.error("[config-validator GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
