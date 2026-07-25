// src/lib/monitoring/authMetrics.ts
//
// Section 5 (Authentication Monitor). Every number here maps to a real,
// specific SystemLog signal already produced by:
//   - src/app/api/auth/login/route.ts (Task 2)
//   - src/app/api/auth/me/route.ts (Task 3 addition — see that file's
//     doc comment; logs only fire on the failure branches, never on the
//     normal/valid-session path)
// No log message text is pattern-matched (fragile) — everything filters
// on the structured `route`/`category`/`severity`/`metadata.reason`
// fields those routes already set.
import prisma from "@/lib/prisma";
import type { AuthMetrics } from "./types";

const LOGIN_ROUTE = "/api/auth/login";
const ME_ROUTE     = "/api/auth/me";

export async function getAuthMetrics(): Promise<AuthMetrics> {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);

  const [
    successfulLoginsToday,
    failedLoginsToday,
    unauthorizedRequestsToday,
    expiredSessionsToday,
  ] = await Promise.all([
    prisma.systemLog.count({
      where: { route: LOGIN_ROUTE, category: "AUTH", severity: "INFO", createdAt: { gte: startOfDay } },
    }),
    // Covers bad-credentials, inactive-account, and rate-limit-exceeded
    // attempts on the login route — all genuinely "a login that didn't
    // succeed", regardless of which of those three it was.
    prisma.systemLog.count({
      where: { route: LOGIN_ROUTE, severity: "WARNING", createdAt: { gte: startOfDay } },
    }),
    prisma.systemLog.count({
      where: {
        route: ME_ROUTE, category: "SECURITY", createdAt: { gte: startOfDay },
        OR: [
          { metadata: { path: ["reason"], equals: "no_token" } },
          { metadata: { path: ["reason"], equals: "inactive_account" } },
        ],
      },
    }),
    prisma.systemLog.count({
      where: {
        route: ME_ROUTE, category: "SECURITY", createdAt: { gte: startOfDay },
        OR: [
          { metadata: { path: ["reason"], equals: "invalid_token" } },
          { metadata: { path: ["reason"], equals: "session_replaced" } },
        ],
      },
    }),
  ]);

  return { successfulLoginsToday, failedLoginsToday, unauthorizedRequestsToday, expiredSessionsToday };
}
