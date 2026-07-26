// src/lib/incidents/generatePatchPreview.ts
//
// Section 3 (Patch Preview). Reuses Task 4's AI Provider Layer exactly
// like analyzeIncident.ts. The system prompt is explicit and repeated:
// this is a PREVIEW for a human to read, never applied automatically —
// nothing in this codebase writes the suggested code anywhere, commits
// it, or deploys it. `approvalStatus` on the saved row is a workflow
// label a developer sets manually; it does not trigger any action.
import prisma from "@/lib/prisma";
import type { Prisma } from "@prisma/client";
import { getActiveProvider } from "@/lib/ai-guardian/providers/registry";
import { AIProviderError } from "@/lib/ai-guardian/providers/types";
import { redactText } from "@/lib/ai-guardian/sanitize";
import { patchPreviewSchema } from "@/lib/incidents/patchPreviewSchema";

export class PatchPreviewError extends Error {}

const SYSTEM_PROMPT = `أنت مهندس برمجيات خبير بتقترح حل محتمل لمشكلة في منصة تعليمية (LMS) مبنية بـ Next.js/Prisma/PostgreSQL. اقتراحك مجرد PREVIEW نصي يقرأه مهندس بشري ويقرر بنفسه — انت مش بتنفذ أو تكتب أو تعدل أي ملف فعليًا، وده مجرد اقتراح توضيحي. الكود اللي تكتبه توضيحي/pseudocode-level، مش مضمون إنه يشتغل حرفيًا من غير مراجعة. أجب بـ JSON صِرف فقط بدون أي نص إضافي أو Markdown fences.`;

function extractJson(text: string): unknown {
  const cleaned = text.trim().replace(/^```(?:json)?\s*/i, "").replace(/```\s*$/i, "");
  return JSON.parse(cleaned);
}

export async function generatePatchPreview(opts: {
  incidentId?: string | null;
  problemDescription: string;
  requestedBy?: string | null;
}) {
  const preferredProviderId = opts.requestedBy
    ? (await prisma.developerSettings.findUnique({ where: { userId: opts.requestedBy }, select: { aiProvider: true } }))?.aiProvider
    : null;

  const provider = getActiveProvider(preferredProviderId);
  if (!provider) {
    throw new PatchPreviewError("لا يوجد مزود ذكاء اصطناعي مُفعَّل. اضبط AI_GUARDIAN_PROVIDER ومفتاح الـ API المطابق.");
  }

  let incidentContext = "";
  if (opts.incidentId) {
    const incident = await prisma.incident.findUnique({ where: { id: opts.incidentId } });
    if (incident) {
      incidentContext = [
        `الحادثة المرتبطة: ${redactText(incident.title)}`,
        `الفئة: ${incident.category} — الخطورة: ${incident.severity}`,
        incident.rootCause ? `السبب الجذري المعروف: ${redactText(incident.rootCause)}` : "",
      ].filter(Boolean).join("\n");
    }
  }

  const userPrompt = [
    incidentContext,
    `وصف المشكلة: ${redactText(opts.problemDescription)}`,
    ``,
    `أرجع JSON مطابق تمامًا لهذا الشكل (القيم أمثلة فقط):`,
    JSON.stringify(
      {
        problemSummary: "string",
        likelyFiles: ["string — مسار ملف محتمل تورطه، تقديري"],
        suggestedChanges: [{ file: "string", description: "string", codeSnippet: "string — كود توضيحي، مش نهائي" }],
        expectedBenefits: ["string"],
        possibleRisks: ["string"],
      },
      null, 0
    ),
  ].filter(Boolean).join("\n");

  let result;
  try {
    result = await provider.generate(SYSTEM_PROMPT, userPrompt);
  } catch (e) {
    if (e instanceof AIProviderError) throw new PatchPreviewError(e.message);
    throw new PatchPreviewError(e instanceof Error ? e.message : "فشل غير متوقع أثناء التوليد");
  }

  let parsed: unknown;
  try {
    parsed = extractJson(result.rawText);
  } catch {
    throw new PatchPreviewError("تعذّر تحليل استجابة الذكاء الاصطناعي كـ JSON صالح");
  }

  const validated = patchPreviewSchema.safeParse(parsed);
  if (!validated.success) {
    throw new PatchPreviewError(`استجابة غير مطابقة للشكل المتوقع: ${validated.error.errors[0]?.message ?? "خطأ غير معروف"}`);
  }

  const content = validated.data;

  const saved = await prisma.patchPreview.create({
    data: {
      incidentId:       opts.incidentId ?? undefined,
      problemSummary:   content.problemSummary,
      likelyFiles:      content.likelyFiles,
      suggestedChanges: content.suggestedChanges as unknown as Prisma.InputJsonValue,
      expectedBenefits: content.expectedBenefits,
      possibleRisks:    content.possibleRisks,
      provider:         provider.id,
      model:            result.model,
      createdBy:        opts.requestedBy ?? undefined,
    },
  });

  return saved;
}
