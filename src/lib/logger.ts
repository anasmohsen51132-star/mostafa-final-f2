// src/lib/logger.ts
//
// Centralized logging service backing SystemLog (see prisma/schema.prisma)
// and the Developer Dashboard's Error Center + System Events pages.
//
// Design goals:
//   - ONE place every part of the app calls through (no scattered
//     console.error calls that vanish into Vercel's logs and are never
//     seen again).
//   - Logging can NEVER throw or reject in a way that breaks the request
//     it's observing — every write is wrapped so a logging failure just
//     logs itself to console and moves on.
//   - Severity/category types are imported from @prisma/client (generated
//     directly from the LogSeverity/LogCategory enums in schema.prisma)
//     rather than hand-duplicated string unions here, so this file can
//     never drift out of sync with the database schema.
import type { NextRequest } from "next/server";
import type { Prisma, LogSeverity, LogCategory } from "@prisma/client";
import prisma from "@/lib/prisma";
import { extractToken, verifyToken } from "@/lib/auth";
import { getClientIp } from "@/lib/rate-limit";
import { error as errorResponse } from "@/lib/utils";

export interface LogContext {
  route?: string | null;
  method?: string | null;
  userId?: string | null;
  role?: string | null;
  ip?: string | null;
  userAgent?: string | null;
  stack?: string | null;
  metadata?: Record<string, unknown> | null;
}

interface WriteLogInput extends LogContext {
  severity: LogSeverity;
  category: LogCategory;
  message: string;
}

// Reasonable caps so one runaway caller (e.g. a stack trace or a huge
// metadata blob) can't bloat the log table unboundedly — mirrors the same
// defensive-sizing pattern already used for quiz/homework answers
// (MAX_ANSWERS_BYTES in src/lib/validations.ts).
const MAX_MESSAGE_LEN    = 2000;
const MAX_STACK_LEN      = 8000;
const MAX_USER_AGENT_LEN = 500;

// ---- Core writer ---------------------------------------------------
//
// Deliberately NOT exported — everything goes through logInfo/logWarning/
// logError/logCritical below so the severity is always explicit at the
// call site and can't be passed as an arbitrary string.
async function writeLog(input: WriteLogInput): Promise<void> {
  try {
    await prisma.systemLog.create({
      data: {
        severity: input.severity,
        category: input.category,
        message:  input.message.slice(0, MAX_MESSAGE_LEN),
        route:    input.route ?? undefined,
        method:   input.method ?? undefined,
        userId:   input.userId ?? undefined,
        role:     input.role ?? undefined,
        ip:       input.ip ?? undefined,
        userAgent: input.userAgent?.slice(0, MAX_USER_AGENT_LEN),
        stack:     input.stack?.slice(0, MAX_STACK_LEN),
        metadata:  (input.metadata ?? undefined) as Prisma.InputJsonValue | undefined,
      },
    });
  } catch (e) {
    // This IS the logging system — it has nowhere further to report its
    // own failure to, so a plain console.error is the correct floor here
    // (not a violation of the "no console.log" rule elsewhere, since this
    // is console.error and it's the one legitimate last-resort path).
    console.error("[logger] failed to write SystemLog", e);
  }
}

export function logInfo(category: LogCategory, message: string, ctx: LogContext = {}): Promise<void> {
  return writeLog({ severity: "INFO", category, message, ...ctx });
}

export function logWarning(category: LogCategory, message: string, ctx: LogContext = {}): Promise<void> {
  return writeLog({ severity: "WARNING", category, message, ...ctx });
}

export function logError(category: LogCategory, message: string, ctx: LogContext = {}): Promise<void> {
  return writeLog({ severity: "ERROR", category, message, ...ctx });
}

export function logCritical(category: LogCategory, message: string, ctx: LogContext = {}): Promise<void> {
  return writeLog({ severity: "CRITICAL", category, message, ...ctx });
}

// ---- Request context helper -----------------------------------------
//
// Best-effort extraction of {route, method, ip, userAgent, userId, role}
// from a NextRequest. Never throws — an unauthenticated or malformed
// request just yields a context with userId/role left unset.
export async function extractRequestContext(req: NextRequest): Promise<LogContext> {
  const ctx: LogContext = {
    route:     new URL(req.url).pathname,
    method:    req.method,
    ip:        getClientIp(req),
    userAgent: req.headers.get("user-agent"),
  };
  try {
    const token = extractToken(req);
    if (token) {
      const payload = await verifyToken(token);
      if (payload) {
        ctx.userId = payload.sub;
        ctx.role   = payload.role;
      }
    }
  } catch {
    // no valid session — log without identity rather than failing
  }
  return ctx;
}

// ---- Optional adoption wrapper for route handlers ---------------------
//
// Wraps an App Router handler so any error it throws is logged with full
// request context and a generic Arabic error response is returned —
// matching the exact { success: false, error } shape every route in this
// project already returns from its own try/catch (see src/lib/utils.ts).
//
// This is intentionally opt-in per route, e.g.:
//
//   export const POST = withApiLogging("upload:create", "UPLOAD", async (req) => {
//     ...
//   });
//
// It is NOT applied to any existing route automatically — adopting it on
// an existing endpoint is a deliberate, reviewable change left to whoever
// owns that route, not something this file does on its own.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type RouteHandler = (req: NextRequest, ...rest: any[]) => Promise<Response>;

export function withApiLogging(
  routeLabel: string,
  category: LogCategory,
  handler: RouteHandler
): RouteHandler {
  return async (req, ...rest) => {
    try {
      return await handler(req, ...rest);
    } catch (e) {
      const ctx = await extractRequestContext(req);
      await logError(category, `[${routeLabel}] ${e instanceof Error ? e.message : String(e)}`, {
        ...ctx,
        stack: e instanceof Error ? e.stack : null,
      });
      return errorResponse("حدث خطأ في الخادم", 500);
    }
  };
}
