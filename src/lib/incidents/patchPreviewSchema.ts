// src/lib/incidents/patchPreviewSchema.ts
//
// Structured shape for Section 3 (Patch Preview). Every field here is
// descriptive text for a human to read and judge — `codeSnippet` is
// illustrative example code, never executed, written to disk, or applied
// by this codebase in any way.
import { z } from "zod";

const suggestedChangeSchema = z.object({
  file: z.string(),
  description: z.string(),
  codeSnippet: z.string(),
});

export const patchPreviewSchema = z.object({
  problemSummary:   z.string(),
  likelyFiles:      z.array(z.string()).default([]),
  suggestedChanges: z.array(suggestedChangeSchema).default([]),
  expectedBenefits: z.array(z.string()).default([]),
  possibleRisks:    z.array(z.string()).default([]),
});

export type PatchPreviewContent = z.infer<typeof patchPreviewSchema>;
export type SuggestedChange = z.infer<typeof suggestedChangeSchema>;
