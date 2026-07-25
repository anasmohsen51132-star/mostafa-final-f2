// src/lib/ai-guardian/generateReport.ts
//
// The full pipeline described in Task 4's architecture diagram:
//   Monitoring Layer → AI Analysis Layer → AI Provider Layer → Provider API
//
// Always human-triggered (see POST /api/developer/ai-guardian/reports) —
// nothing in this module runs on a schedule.
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getPlatformSnapshot } from "@/lib/ai-guardian/monitoring/snapshot";
import { sanitizeSnapshot } from "@/lib/ai-guardian/sanitize";
import { buildUserPrompt, GUARDIAN_SYSTEM_PROMPT } from "@/lib/ai-guardian/promptBuilder";
import { getActiveProvider } from "@/lib/ai-guardian/providers/registry";
import { guardianReportSchema, type GuardianReport } from "@/lib/ai-guardian/reportSchema";
import { AIProviderError } from "@/lib/ai-guardian/providers/types";

export class GuardianGenerationError extends Error {}

function extractJson(text: string): unknown {
  // The system prompt instructs pure JSON with no fences, but strip them
  // defensively in case a provider wraps its output anyway.
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

export async function generateGuardianReport(opts: { windowHours?: number; generatedBy?: string | null }) {
  const windowHours = opts.windowHours ?? 24;

  const provider = getActiveProvider();
  if (!provider) {
    throw new GuardianGenerationError(
      "لا يوجد مزود ذكاء اصطناعي مُفعَّل حاليًا. اضبط AI_GUARDIAN_PROVIDER ومفتاح الـ API المطابق (ANTHROPIC_API_KEY / OPENAI_API_KEY / GEMINI_API_KEY) في متغيرات البيئة."
    );
  }

  // ---- Monitoring Layer → sanitized snapshot ----
  const rawSnapshot = await getPlatformSnapshot(windowHours);
  const snapshot = sanitizeSnapshot(rawSnapshot);

  // ---- AI Analysis Layer: prompt construction ----
  const userPrompt = buildUserPrompt(snapshot);

  // ---- AI Provider Layer ----
  let result;
  try {
    result = await provider.generate(GUARDIAN_SYSTEM_PROMPT, userPrompt);
  } catch (e) {
    if (e instanceof AIProviderError) throw new GuardianGenerationError(e.message);
    throw new GuardianGenerationError(e instanceof Error ? e.message : "فشل غير متوقع أثناء استدعاء مزود الذكاء الاصطناعي");
  }

  let parsedJson: unknown;
  try {
    parsedJson = extractJson(result.rawText);
  } catch {
    throw new GuardianGenerationError("تعذّر تحليل استجابة الذكاء الاصطناعي كـ JSON صالح");
  }

  const validated = guardianReportSchema.safeParse(parsedJson);
  if (!validated.success) {
    throw new GuardianGenerationError(
      `استجابة الذكاء الاصطناعي لا تطابق الشكل المتوقع: ${validated.error.errors[0]?.message ?? "خطأ غير معروف"}`
    );
  }

  const report: GuardianReport = validated.data;

  // ---- Persist (audit trail — never re-runs itself, no side effects
  // beyond writing this one row) ----
  const saved = await prisma.aiGuardianReport.create({
    data: {
      provider:      provider.id,
      model:         result.model,
      windowHours,
      platformScore: report.platformScore,
      status:        report.status,
      summary:       report.executiveSummary,
      reportJson:    report as unknown as Prisma.InputJsonValue,
      inputSnapshot: snapshot as unknown as Prisma.InputJsonValue,
      tokensUsed:    result.tokensUsed ?? undefined,
      generatedBy:   opts.generatedBy ?? undefined,
    },
  });

  return saved;
}
