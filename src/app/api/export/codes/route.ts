// src/app/api/export/codes/route.ts
// Returns an .xlsx file with access codes
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

// SEC-013 FIX: the `xlsx` (SheetJS) package at the version pinned in
// package.json has known prototype-pollution / ReDoS advisories with no fix
// published to the npm registry. We replace it with `exceljs`, which is
// actively maintained and has no such advisories.
//
// INFRA-005 FIX: the writer library is now imported dynamically (inside the
// handler) instead of at module scope, so it's only loaded into memory for
// requests that actually hit this route, keeping cold starts on every other
// route lighter.
//
// BUG-008 FIX: capped at 2000 rows per export instead of loading up to 5000
// rows into memory in one serverless invocation. For larger catalogs, export
// in batches using `?unused=1` plus date-range filters, or move this to a
// background job (see ARCH-004 recommendation for bulk operations generally).
const MAX_EXPORT_ROWS = 2000;

export async function GET(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  const url = new URL(req.url);
  const onlyUnused = url.searchParams.get("unused") === "1";

  try {
    const codes = await prisma.accessCode.findMany({
      where: onlyUnused ? { usedById: null, isActive: true } : undefined,
      include: {
        courses: { include: { course: { select: { title: true } } } },
        usedBy:  { select: { name: true, phone: true } },
      },
      orderBy: { createdAt: "desc" },
      take: MAX_EXPORT_ROWS,
    });

    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet("الكودات");

    ws.columns = [
      { header: "الكود", key: "code", width: 16 },
      { header: "الكورسات", key: "courses", width: 30 },
      { header: "الحالة", key: "status", width: 10 },
      { header: "مستخدم من", key: "usedByName", width: 20 },
      { header: "هاتف المستخدم", key: "usedByPhone", width: 14 },
      { header: "تاريخ الاستخدام", key: "usedAt", width: 18 },
      { header: "تاريخ الإنشاء", key: "createdAt", width: 18 },
      { header: "تاريخ الانتهاء", key: "expiresAt", width: 18 },
      { header: "ملاحظة", key: "note", width: 20 },
    ];

    for (const c of codes) {
      ws.addRow({
        code: c.code,
        courses: c.courses.map((cc: { course: { title: string } }) => cc.course.title).join(" | "),
        status: c.usedBy ? "مستخدم" : "متاح",
        usedByName: c.usedBy?.name ?? "",
        usedByPhone: c.usedBy?.phone ?? "",
        usedAt: c.usedAt ? new Date(c.usedAt).toLocaleDateString("ar-EG") : "",
        createdAt: new Date(c.createdAt).toLocaleDateString("ar-EG"),
        expiresAt: c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("ar-EG") : "بلا انتهاء",
        note: c.note ?? "",
      });
    }

    const buf = await wb.xlsx.writeBuffer();

    return new Response(buf, {
      headers: {
        "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": `attachment; filename="codes-${Date.now()}.xlsx"`,
      },
    });
  } catch (e) {
    console.error("[export codes]", e);
    return new Response(JSON.stringify({ error: "خطأ في التصدير" }), {
      status: 500, headers: { "Content-Type": "application/json" },
    });
  }
}
