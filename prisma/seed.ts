// prisma/seed.ts
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  await prisma.siteSettings.upsert({
    where: { id: "singleton" },
    create: { id: "singleton" },
    update: {},
  });

  // Owner account
  const ownerPhone    = process.env.OWNER_PHONE    || "01000000000";
  const ownerPassword = process.env.OWNER_PASSWORD || "owner1234";
  const ownerName     = process.env.OWNER_NAME     || "مستر مصطفى";

  const existing = await prisma.user.findUnique({ where: { phone: ownerPhone } });
  if (!existing) {
    const hash = await bcrypt.hash(ownerPassword, 12);
    await prisma.user.create({
      data: { name: ownerName, phone: ownerPhone, passwordHash: hash, role: "OWNER", avatar: "م" },
    });
    console.log(`✅ Owner: ${ownerPhone}`);
  } else {
    console.log("ℹ️  Owner already exists");
  }

  // Demo course — all levels
  const course = await prisma.course.upsert({
    where: { id: "demo-course-1" },
    create: {
      id: "demo-course-1",
      title: "النحو والصرف للمبتدئين",
      description: "دورة شاملة في أساسيات النحو والصرف",
      icon: "📖", color: "#1A6B47", isPublished: true,
      levels: {
        create: [
          { academicLevel: "FIRST_SECONDARY" },
          { academicLevel: "SECOND_SECONDARY" },
          { academicLevel: "THIRD_SECONDARY" },
        ],
      },
    },
    update: {},
  });
  console.log(`✅ Demo course: ${course.title}`);

  const lecture = await prisma.lecture.upsert({
    where: { id: "demo-lecture-1" },
    create: { id: "demo-lecture-1", title: "المقدمة: ما هي اللغة العربية؟", order: 1 },
    update: {},
  });

  await prisma.courseLecture.upsert({
    where: { courseId_lectureId: { courseId: course.id, lectureId: lecture.id } },
    create: { courseId: course.id, lectureId: lecture.id, order: 1 },
    update: {},
  });

  console.log("✅ Demo lecture linked");
  console.log("\n🎉 Seed complete!");
  console.log(`\n📋 Login: ${ownerPhone} / ${ownerPassword}`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
