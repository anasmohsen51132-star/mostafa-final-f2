// src/app/api/export/codes/route.ts
// Returns an .xlsx file with all access codes
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";
import * as XLSX from "xlsx";

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
      take: 5000,
    });

    // Build worksheet rows
    const rows = codes.map((c: { code: string; courses: { course: { title: string } }[]; usedBy?: { name: string; phone: string } | null; usedAt?: Date | null; createdAt: Date; expiresAt?: Date | null; note?: string | null }) => ({
      "الكود":          c.code,
      "الكورسات":       c.courses.map((cc: { course: { title: string } }) => cc.course.title).join(" | "),
      "الحالة":         c.usedBy ? "مستخدم" : "متاح",
      "مستخدم من":      c.usedBy?.name   ?? "",
      "هاتف المستخدم":  c.usedBy?.phone  ?? "",
      "تاريخ الاستخدام": c.usedAt  ? new Date(c.usedAt).toLocaleDateString("ar-EG")  : "",
      "تاريخ الإنشاء":  new Date(c.createdAt).toLocaleDateString("ar-EG"),
      "تاريخ الانتهاء": c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("ar-EG") : "بلا انتهاء",
      "ملاحظة":         c.note ?? "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
      { wch: 16 }, // code
      { wch: 30 }, // courses
      { wch: 10 }, // status
      { wch: 20 }, // used by
      { wch: 14 }, // phone
      { wch: 18 }, // used at
      { wch: 18 }, // created
      { wch: 18 }, // expires
      { wch: 20 }, // note
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "الكودات");

    const buf = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

    return new Response(buf, {
      headers: {
        "Content-Type":        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
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
