// src/app/api/auth/onboarding-seen/route.ts
// FEATURE: welcome tour — called once by WelcomeTour when the student
// finishes or skips it, so hasSeenOnboarding flips server-side and the
// tour is gone for good on this account, on every device, even after the
// browser's local data is cleared. See prisma/schema.prisma and
// src/components/onboarding/WelcomeTour.tsx for the rest of the feature.
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();

  try {
    await prisma.user.update({
      where: { id: payload.sub },
      data: { hasSeenOnboarding: true },
    });
    return success({ hasSeenOnboarding: true });
  } catch (e) {
    console.error("[onboarding-seen]", e);
    return error("حدث خطأ", 500);
  }
}
