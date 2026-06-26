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
