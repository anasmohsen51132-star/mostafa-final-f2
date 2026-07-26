// src/app/api/developer/backup/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { getBackupProvider } from "@/lib/backup/registry";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const provider = getBackupProvider();
    const status = await provider.getBackupStatus();
    return success(status);
  } catch (e) {
    console.error("[developer/backup GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
