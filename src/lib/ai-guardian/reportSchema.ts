// src/lib/ai-guardian/reportSchema.ts
//
// The AI never returns free text that gets executed or interpreted as
// instructions — it returns JSON validated against this schema. If a
// provider's output doesn't parse, generateReport.ts rejects it rather
// than guessing or partially trusting it (see providers/*).
import { z } from "zod";

const PRIORITY = ["LOW", "MEDIUM", "HIGH", "URGENT"] as const;
const SEVERITY2 = ["WARNING", "CRITICAL"] as const;
const INSIGHT_SEVERITY = ["INFO", "WARNING", "CRITICAL"] as const;
const CATEGORY = ["PERFORMANCE", "DATABASE", "AUTH", "STORAGE", "SECURITY", "API", "SYSTEM"] as const;
const COMPONENT = ["PERFORMANCE", "DATABASE", "AUTHENTICATION", "STORAGE", "SECURITY", "API"] as const;
const HEALTH_STATE = ["HEALTHY", "WARNING", "CRITICAL", "UNKNOWN"] as const;
const RISK_TYPE = [
  "DATABASE_SATURATION", "STORAGE_EXHAUSTION", "API_INSTABILITY",
  "AUTH_DEGRADATION", "MEMORY_PRESSURE", "TRAFFIC_SPIKE", "OTHER",
] as const;

const rootCauseSchema = z.object({
  explanation: z.string(),
  evidence: z.array(z.string()).default([]),
  alternativeHypotheses: z.array(z.string()).default([]),
  confidence: z.number().min(0).max(100),
  potentialConsequences: z.string(),
  filesLikelyInvolved: z.array(z.string()).default([]),
  subsystem: z.string(),
  investigationSteps: z.array(z.string()).default([]),
  suggestedSolution: z.string(),
  priority: z.enum(PRIORITY),
});

const incidentSchema = z.object({
  title: z.string(),
  severity: z.enum(SEVERITY2),
  summary: z.string(),
  rootCause: rootCauseSchema,
});

const insightSchema = z.object({
  title: z.string(),
  description: z.string(),
  category: z.enum(CATEGORY),
  severity: z.enum(INSIGHT_SEVERITY),
});

const predictionSchema = z.object({
  title: z.string(),
  description: z.string(),
  risk: z.enum(RISK_TYPE),
  confidence: z.number().min(0).max(100),
});

const recommendationSchema = z.object({
  title: z.string(),
  description: z.string(),
  priority: z.enum(PRIORITY),
});

const componentHealthSchema = z.object({
  name: z.enum(COMPONENT),
  status: z.enum(HEALTH_STATE),
  summary: z.string(),
});

export const guardianReportSchema = z.object({
  executiveSummary: z.string(),
  platformScore: z.number().min(0).max(100),
  status: z.enum(["HEALTHY", "WARNING", "CRITICAL"]),
  criticalIncidents: z.array(incidentSchema).default([]),
  warnings: z.array(incidentSchema).default([]),
  recoveredProblems: z.array(z.string()).default([]),
  componentHealth: z.array(componentHealthSchema).default([]),
  insights: z.array(insightSchema).default([]),
  predictions: z.array(predictionSchema).default([]),
  recommendations: z.array(recommendationSchema).default([]),
  technicalNotes: z.string().default(""),
});

export type GuardianReport = z.infer<typeof guardianReportSchema>;
export type GuardianIncident = z.infer<typeof incidentSchema>;
export type GuardianInsight = z.infer<typeof insightSchema>;
export type GuardianPrediction = z.infer<typeof predictionSchema>;
export type GuardianRecommendation = z.infer<typeof recommendationSchema>;
export type GuardianComponentHealth = z.infer<typeof componentHealthSchema>;
