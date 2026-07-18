// src/app/api/admin/announcement/route.ts
//
// CUSTOM-010: site-wide announcement bar, editable by ADMIN or OWNER.
// Deliberately a separate route+schema from /api/owner/customize even
// though it writes to the same SiteSettings row — that endpoint is
// OWNER-only, and this feature explicitly needs to also allow ADMIN.
// /api/admin/* is exactly the prefix middleware.ts already grants to both
// roles, so this gets that protection for free (see middleware.ts).
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { announcementSchema } from "@/lib/validations";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

async function requireAdminOrOwner(req: NextRequest) {
  const token = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return { error: unauthorized() };
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") {
    return { error: forbidden("فقط الأدمن أو المالك يمكنهما تعديل الإعلان") };
  }
  return { payload };
}

export async function PUT(req: NextRequest) {
  const gate = await requireAdminOrOwner(req);
  if (gate.error) return gate.error;

  try {
    const body = await req.json();
    const parsed = announcementSchema.safeParse(body);
    if (!parsed.success) return error(parsed.error.errors[0]?.message || "بيانات غير صحيحة");

    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: {
        id: "singleton",
        announcementEnabled: parsed.data.enabled,
        announcementTitle: parsed.data.title,
        announcementText: parsed.data.text,
        announcementLink: parsed.data.link,
        announcementDismissible: parsed.data.dismissible,
      },
      update: {
        announcementEnabled: parsed.data.enabled,
        announcementTitle: parsed.data.title,
        announcementText: parsed.data.text,
        announcementLink: parsed.data.link,
        announcementDismissible: parsed.data.dismissible,
      },
    });
    return success(settings);
  } catch (e) {
    console.error("[admin/announcement PUT]", e);
    return error("فشل الحفظ", 500);
  }
}

// Separate from "enabled: false" on purpose — DELETE actually clears the
// text/link too, matching the request that admin/owner should be able to
// either "delete it or leave it" (i.e. fully remove vs. just toggle off).
export async function DELETE(req: NextRequest) {
  const gate = await requireAdminOrOwner(req);
  if (gate.error) return gate.error;

  try {
    const settings = await prisma.siteSettings.upsert({
      where: { id: "singleton" },
      create: { id: "singleton" },
      update: {
        announcementEnabled: false,
        announcementTitle: null,
        announcementText: null,
        announcementLink: null,
      },
    });
    return success(settings);
  } catch (e) {
    console.error("[admin/announcement DELETE]", e);
    return error("فشل الحذف", 500);
  }
}
