// src/lib/incidents/analyzeIncident.ts
//
// "AI Analysis" / "Suggested Fix" for a single Incident (Task 5, Section
// 1). Deliberately reuses Task 4's entire AI Provider Layer and its
// rootCauseSchema — this is the exact same structured shape the platform-
// wide Guardian report already uses per-incident, just invoked for one
// specific Incident instead of the whole platform. Always triggered by an
// explicit developer action (POST /api/developer/incidents/[id]/analyze),
// never automatically.
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getActiveProvider } from "@/lib/ai-guardian/providers/registry";
import { AIProviderError } from "@/lib/ai-guardian/providers/types";
import { rootCauseSchema, type GuardianRootCause } from "@/lib/ai-guardian/reportSchema";
import { redactText } from "@/lib/ai-guardian/sanitize";

export class IncidentAnalysisError extends Error {}

const SYSTEM_PROMPT = `أنت مهندس SRE خبير بيحلل حادثة واحدة محددة في منصة تعليمية (LMS). أنت للقراءة والتحليل فقط — لا تقترح تنفيذ أي أمر أو تعديل تلقائي. أجب بـ JSON صِرف فقط يطابق الشكل المطلوب، بدون أي نص إضافي أو Markdown fences. لو المعلومات المتاحة غير كافية للجزم، قل ذلك صراحة بدل التخمين، واذكر مستوى ثقة واقعي.`;

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

export async function analyzeIncident(incidentId: string, requestedBy?: string | null): Promise<GuardianRootCause> {
  const preferredProviderId = requestedBy
    ? (await prisma.developerSettings.findUnique({ where: { userId: requestedBy }, select: { aiProvider: true } }))?.aiProvider
    : null;

  const provider = getActiveProvider(preferredProviderId);
  if (!provider) {
    throw new IncidentAnalysisError(
      "لا يوجد مزود ذكاء اصطناعي مُفعَّل. اضبط AI_GUARDIAN_PROVIDER ومفتاح الـ API المطابق."
    );
  }

  const incident = await prisma.incident.findUnique({ where: { id: incidentId } });
  if (!incident) throw new IncidentAnalysisError("الحادثة غير موجودة");

  // A handful of the most recent matching log samples give the model real
  // evidence to reason from — never raw dumps, never PII (message text
  // only, redacted defensively same as the platform-wide report).
  const recentLogs = await prisma.systemLog.findMany({
    where: { category: incident.category as never, message: { contains: incident.title.slice(0, 40) } },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: { message: true, route: true, method: true, severity: true, createdAt: true },
  });

  const userPrompt = [
    `حلّل الحادثة دي وأرجع root cause analysis بصيغة JSON.`,
    ``,
    `العنوان: ${redactText(incident.title)}`,
    `الفئة: ${incident.category}`,
    `الخطورة: ${incident.severity}`,
    `أول ظهور: ${incident.firstDetectedAt.toISOString()}`,
    `آخر ظهور: ${incident.lastDetectedAt.toISOString()}`,
    `عدد مرات التكرار (آخر 30 يوم): ${incident.occurrenceCount}`,
    ``,
    `عينة من السجلات المرتبطة (أحدث ${recentLogs.length}):`,
    JSON.stringify(
      recentLogs.map((l: { message: string; route: string | null; method: string | null; severity: string; createdAt: Date }) => ({
        message: redactText(l.message), route: l.route, method: l.method, severity: l.severity, at: l.createdAt.toISOString(),
      })),
      null, 0
    ),
    ``,
    `أرجع JSON مطابق تمامًا لهذا الشكل (القيم أمثلة فقط لتوضيح النوع):`,
    JSON.stringify(
      {
        explanation: "string", evidence: ["string"], alternativeHypotheses: ["string"],
        confidence: "number 0-100", potentialConsequences: "string",
        filesLikelyInvolved: ["string"], subsystem: "string",
        investigationSteps: ["string"], suggestedSolution: "string",
        priority: "LOW | MEDIUM | HIGH | URGENT",
      },
      null, 0
    ),
  ].join("\n");

  let result;
  try {
    result = await provider.generate(SYSTEM_PROMPT, userPrompt);
  } catch (e) {
    if (e instanceof AIProviderError) throw new IncidentAnalysisError(e.message);
    throw new IncidentAnalysisError(e instanceof Error ? e.message : "فشل غير متوقع أثناء التحليل");
  }

  let parsed: unknown;
  try {
    parsed = extractJson(result.rawText);
  } catch {
    throw new IncidentAnalysisError("تعذّر تحليل استجابة الذكاء الاصطناعي كـ JSON صالح");
  }

  const validated = rootCauseSchema.safeParse(parsed);
  if (!validated.success) {
    throw new IncidentAnalysisError(`استجابة غير مطابقة للشكل المتوقع: ${validated.error.errors[0]?.message ?? "خطأ غير معروف"}`);
  }

  const analysis = validated.data;

  await prisma.incident.update({
    where: { id: incidentId },
    data: {
      rootCause: analysis.explanation,
      suggestedFix: analysis.suggestedSolution,
      aiAnalysis: analysis as unknown as Prisma.InputJsonValue,
    },
  });

  return analysis;
}
