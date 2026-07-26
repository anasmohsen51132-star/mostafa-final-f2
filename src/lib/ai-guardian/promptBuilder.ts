// src/lib/ai-guardian/promptBuilder.ts
import type { PlatformSnapshot } from "@/lib/ai-guardian/monitoring/contracts";

// The persona + hard constraints are identical regardless of which
// provider ends up running this — this is what makes providers truly
// interchangeable (see providers/*).
export const GUARDIAN_SYSTEM_PROMPT = `أنت "AI Guardian" — محرك ذكاء داخلي لمنصة تعليمية (LMS) مبنية بـ Next.js/Prisma/PostgreSQL. أنت لست مساعد محادثة ولا دعم فني — أنت طبقة تحليل تراقب صحة المنصة فقط.

فكّر بعقلية مهندس SRE / Principal Engineer / DevOps / Security / QA خبير. حلل البيانات المُعطاة لك بعمق تقني حقيقي، مش كلام عام.

قواعد صارمة يجب الالتزام بها دائمًا:
- أنت للقراءة والتحليل فقط. لا تقترح أبدًا تنفيذ أوامر، تعديل قاعدة بيانات، حذف بيانات، أو أي إجراء تلقائي — فقط تحليل وتوصيات يراجعها ويوافق عليها إنسان.
- لو قسم بيانات معين غير متاح (null) في المدخلات، قل بوضوح إنه "غير مُجمَّع بعد" — لا تخترع أرقام أو حالة لهذا القسم أبدًا.
- كل تنبؤ (prediction) هو تقدير احتمالي فقط، ويجب أن يحمل درجة ثقة (confidence) واقعية — لا تدّعي يقين.
- تجنب العبارات العامة الفضفاضة ("النظام يعمل بشكل جيد"). كن محددًا: أرقام، نِسَب، أسماء endpoints/فئات فعلية من البيانات المُعطاة.
- لو البيانات غير كافية لاستنتاج معين، قل ذلك صراحة بدل التخمين.
- أجب بـ JSON صِرف فقط يطابق الـ schema المذكورة، بدون أي نص قبله أو بعده، وبدون Markdown code fences.`;

export function buildUserPrompt(snapshot: PlatformSnapshot): string {
  return [
    `فترة المراقبة: آخر ${snapshot.windowHours} ساعة. وقت التوليد: ${snapshot.generatedAt}.`,
    ``,
    `بيانات المنصة (مُجمّعة ومُلخّصة مسبقًا — وليست بيانات خام):`,
    JSON.stringify(
      {
        errors: snapshot.errors,
        auth: snapshot.auth,
        security: snapshot.security,
        systemEvents: snapshot.systemEvents,
        performance: snapshot.performance,   // null = not collected yet (Task 3 pending)
        database: snapshot.database,          // null = not collected yet (Task 3 pending)
        storage: snapshot.storage,            // null = not collected yet (Task 3 pending)
      },
      null,
      0
    ),
    ``,
    `أنتج تقرير AI Guardian بصيغة JSON مطابقة تمامًا لهذا الشكل (القيم أمثلة فقط لتوضيح النوع، استبدلها بتحليلك الفعلي):`,
    JSON.stringify(
      {
        executiveSummary: "string — 2-4 جمل تلخّص حالة المنصة",
        platformScore: "number 0-100",
        status: "HEALTHY | WARNING | CRITICAL",
        criticalIncidents: [
          {
            title: "string", severity: "WARNING | CRITICAL", summary: "string",
            rootCause: {
              explanation: "string", evidence: ["string"], alternativeHypotheses: ["string"],
              confidence: "number 0-100", potentialConsequences: "string",
              filesLikelyInvolved: ["string"], subsystem: "string",
              investigationSteps: ["string"], suggestedSolution: "string",
              priority: "LOW | MEDIUM | HIGH | URGENT",
            },
          },
        ],
        warnings: "نفس شكل criticalIncidents",
        recoveredProblems: ["string — مشاكل ظهرت في السجلات ثم لم تتكرر مؤخرًا"],
        componentHealth: [
          { name: "PERFORMANCE | DATABASE | AUTHENTICATION | STORAGE | SECURITY | API", status: "HEALTHY | WARNING | CRITICAL | UNKNOWN", summary: "string" },
        ],
        insights: [
          { title: "string", description: "string", category: "PERFORMANCE | DATABASE | AUTH | STORAGE | SECURITY | API | SYSTEM", severity: "INFO | WARNING | CRITICAL" },
        ],
        predictions: [
          { title: "string", description: "string", risk: "DATABASE_SATURATION | STORAGE_EXHAUSTION | API_INSTABILITY | AUTH_DEGRADATION | MEMORY_PRESSURE | TRAFFIC_SPIKE | OTHER", confidence: "number 0-100" },
        ],
        recommendations: [
          {
            title: "string", description: "string", priority: "LOW | MEDIUM | HIGH | URGENT",
            difficulty: "EASY | MODERATE | HARD — تقدير صعوبة التنفيذ",
            estimatedImpact: "LOW | MEDIUM | HIGH — الأثر المتوقع لو اتنفذت",
            reason: "string — ليه التوصية دي مهمة بناءً على البيانات المُعطاة",
            relatedComponent: "string — مثال: قاعدة البيانات، رفع الملفات، المصادقة",
            suggestedInvestigation: "string — خطوة عملية أولى للتحقق قبل التنفيذ",
          },
        ],
        technicalNotes: "string — ملاحظات تقنية إضافية، أو حدود التحليل بسبب نقص بيانات",
      },
      null,
      0
    ),
  ].join("\n");
}
