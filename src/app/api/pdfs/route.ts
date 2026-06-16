// src/app/api/pdfs/route.ts
import { NextRequest } from "next/server";
import { extractToken, verifyToken } from "@/lib/auth";
import { success, error, unauthorized, forbidden } from "@/lib/utils";
import prisma from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const { lectureId, title, fileUrl, order } = await req.json();
    if (!lectureId || !title || !fileUrl) return error("lectureId و title و fileUrl مطلوبة");

    const pdf = await prisma.pDF.create({
      data: { lectureId, title, fileUrl, order: order ?? 0 },
    });
    return success(pdf);
  } catch (e) {
    console.error("[pdfs POST]", e);
    return error("حدث خطأ", 500);
  }
}

export async function DELETE(req: NextRequest) {
  const token   = extractToken(req);
  const payload = token ? await verifyToken(token) : null;
  if (!payload) return unauthorized();
  if (payload.role !== "ADMIN" && payload.role !== "OWNER") return forbidden();

  try {
    const { id } = await req.json();
    if (!id) return error("id مطلوب");
    await prisma.pDF.delete({ where: { id } });
    return success({ deleted: true });
  } catch (e) {
    console.error("[pdfs DELETE]", e);
    return error("فشل الحذف", 500);
  }
}
