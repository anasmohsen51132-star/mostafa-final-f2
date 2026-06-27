// src/lib/prisma.ts
// BUG-004 / INFRA-002 FIX: the previous code only cached the singleton on
// `globalForPrisma` when NODE_ENV !== "production". On Vercel, NODE_ENV IS
// "production", so every serverless invocation created a brand-new
// PrismaClient (and a brand-new pool of DB connections) that was never reused
// between invocations of the *same* warm lambda instance — this is what
// exhausted Neon's connection limit ("too many connections" / ECONNREFUSED).
// We now always reuse the global singleton, in every environment.
//
// IMPORTANT (INFRA-002): point DATABASE_URL at Neon's PgBouncer-pooled
// connection string and add `?connection_limit=1&pgbouncer=true` to it.
// Neon dashboard → Connection Details → "Pooled connection". Example:
//   postgresql://user:pass@ep-xxx-pooler.region.aws.neon.tech/db?sslmode=require&pgbouncer=true&connection_limit=1
// This is the single most important lever to avoid connection exhaustion
// under concurrent serverless load (see ARCH-001).
import { PrismaClient } from "@prisma/client";

// INFRA-003 FIX: the pooler requirement was only a code comment, with
// nothing actually checking it at runtime — a direct (non-pooled) Neon URL
// would silently exhaust the connection limit under concurrent load with no
// warning until it happened in production. We warn loudly at startup if the
// configured URL doesn't look like Neon's pooled endpoint. This is a warning
// rather than a hard crash because other Postgres providers (or local dev)
// won't match this pattern and shouldn't be blocked from running.
const dbUrl = process.env.DATABASE_URL || "";
const looksLikeNeon = dbUrl.includes("neon.tech");
const looksPooled   = dbUrl.includes("pgbouncer=true") || dbUrl.includes("-pooler.");
if (looksLikeNeon && !looksPooled && process.env.NODE_ENV === "production") {
  console.error(
    "[prisma] تحذير: DATABASE_URL يبدو أنه يشير إلى Neon لكن بدون pooler " +
    "(لا يحتوي على '-pooler.' أو 'pgbouncer=true'). هذا قد يستهلك اتصالات Neon " +
    "بسرعة تحت الحمل. استخدم 'Pooled connection' من Neon Dashboard."
  );
}

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
  });

globalForPrisma.prisma = prisma;

export default prisma;
