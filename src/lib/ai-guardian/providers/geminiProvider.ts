// src/lib/ai-guardian/providers/geminiProvider.ts
//
// Env vars: GEMINI_API_KEY (required), AI_GUARDIAN_GEMINI_MODEL (optional).
import type { AIProvider, AIProviderResult } from "@/lib/ai-guardian/providers/types";
import { AIProviderError } from "@/lib/ai-guardian/providers/types";

const DEFAULT_MODEL = "gemini-2.0-flash";

export const geminiProvider: AIProvider = {
  id: "gemini",
  displayName: "Google Gemini",

  isConfigured() {
    return Boolean(process.env.GEMINI_API_KEY);
  },

  async generate(systemPrompt, userPrompt): Promise<AIProviderResult> {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) throw new AIProviderError("gemini", "GEMINI_API_KEY غير مُعرَّف");

    const model = process.env.AI_GUARDIAN_GEMINI_MODEL || DEFAULT_MODEL;
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

    const res = await fetch(url, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: systemPrompt }] },
        contents: [{ role: "user", parts: [{ text: userPrompt }] }],
        generationConfig: { responseMimeType: "application/json" },
      }),
    });

    if (!res.ok) {
      const detail = await res.text().catch(() => "");
      throw new AIProviderError("gemini", `فشل استدعاء Gemini API (HTTP ${res.status}): ${detail.slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!text) throw new AIProviderError("gemini", "استجابة Gemini لا تحتوي على نص");

    return {
      rawText: text,
      model,
      tokensUsed: data.usageMetadata?.totalTokenCount ?? null,
    };
  },
};
