// src/app/api/developer/deployments/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import { getDeploymentProvider } from "@/lib/deployments/registry";

export async function GET(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "DEVELOPER") return forbidden();

  try {
    const provider = getDeploymentProvider();
    const configured = provider.isConfigured();
    const deployments = configured ? await provider.listDeployments(20) : [];
    return success({ configured, deployments });
  } catch (e) {
    console.error("[developer/deployments GET]", e);
    return error("حدث خطأ في الخادم", 500);
  }
}
