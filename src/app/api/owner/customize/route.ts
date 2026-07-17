// src/app/api/owner/customize/route.ts
//
// CUSTOM-006 (architecture fix): the old PUT lived at /api/customize, which
// is listed in middleware.ts's PUBLIC_PATHS — so the centralized RBAC layer
// never even looked at this route; the only thing stopping a non-owner was
// the inline role check below. That check is still correct and still here
// (defense in depth costs nothing), but by moving to /api/owner/*, the
// middleware itself now also blocks unauthenticated/non-owner requests
// before they ever reach this handler — the same protection every other
// /api/owner/* route already gets. GET stays at the old /api/customize path
// (see that file) since settings legitimately need to be publicly readable
// (landing page, student dashboard).
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { siteSettingsSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function PUT(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "OWNER") return forbidden("فقط المالك يمكنه تعديل الإعدادات");

  try {
    const body = await req.json();

    // The customize page loads the full GET response into its form state
    // (including system-managed fields like `id` and `updatedAt`) and sends
    // the whole thing back on save. siteSettingsSchema is `.strict()`
    // (intentionally rejects unknown fields to stop arbitrary data
    // injection), so those two leaked fields would fail validation. Strip
    // known non-editable fields before validating, regardless of what the
    // client sends.
    const { id: _id, updatedAt: _updatedAt, ...editableBody } = body ?? {};

    const parsed = siteSettingsSchema.safeParse(editableBody);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton", ...parsed.data },
      update: parsed.data,
    });
    return success(settings);
  } catch (e) {
    console.error("[owner/customize PUT]", e);
    return error("فشل الحفظ", 500);
  }
}
