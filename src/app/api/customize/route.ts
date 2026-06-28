// src/app/api/customize/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { siteSettingsSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // PERF-003 FIX: GET previously ran an upsert on every single request —
    // a write on every read, with no caching. We now do a plain read first;
    // we only fall back to creating the singleton row the very first time
    // it doesn't exist yet (effectively a one-time write, not a per-request one).
    let settings = await prisma.siteSettings.findUnique({ where: { id: "singleton" } });
    if (!settings) {
      settings = await prisma.siteSettings.create({ data: { id: "singleton" } });
    }
    return success(settings);
  } catch (e) {
    console.error("[customize GET]", e);
    return error("حدث خطأ", 500);
  }
}

export async function PUT(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "OWNER") return forbidden("فقط المالك يمكنه تعديل الإعدادات");

  try {
    const body = await req.json();

    // BUGFIX: the customize page loads the full GET response into its form
    // state (including system-managed fields like `id` and `updatedAt`) and
    // sends the whole thing back on save. Since siteSettingsSchema is
    // `.strict()` (SEC-010 fix — intentionally rejects unknown fields to
    // stop arbitrary data injection), those two leaked fields caused EVERY
    // save to fail validation. We strip known non-editable fields here
    // before validating, regardless of what the client sends, instead of
    // relying on the frontend to never include them.
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
    console.error("[customize PUT]", e);
    return error("فشل الحفظ", 500);
  }
}
