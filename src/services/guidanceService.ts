import type { EmergencyCategory } from "@/types/emergency";

export interface GuidanceResult {
  steps: string[];
  /** True only when these steps genuinely came from the real AI call. */
  source: "ai" | "fallback";
}

/**
 * Small, generic, safety-conservative fallback — used ONLY when the
 * real AI guidance call fails or OPENAI_API_KEY isn't configured.
 * Deliberately generic rather than pretending to be tailored, since
 * an untailored-but-honest fallback is safer than a confident-looking
 * one that silently isn't real AI.
 */
function fallbackSteps(alone: boolean): string[] {
  const base = [
    "Stay as calm as you can.",
    "Keep your phone nearby in case emergency services call back.",
    "Follow any instructions from the 999 operator exactly.",
  ];
  return alone
    ? [...base, "If you can safely do so, unlock your door for arriving help."]
    : [...base, "Have the person with you stay close and watch for any changes."];
}

export async function getEmergencyGuidance(
  category: EmergencyCategory,
  description: string,
  alone: boolean,
  imageDataUrl?: string | null
): Promise<GuidanceResult> {
  try {
    const response = await fetch("/api/ai/emergency-guidance", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category,
        description,
        alone,
        imageDataUrl: imageDataUrl ?? undefined,
      }),
    });
    const json = (await response.json()) as { success: boolean; steps?: string[] };
    if (json.success && json.steps && json.steps.length > 0) {
      return { steps: json.steps, source: "ai" };
    }
  } catch {
    // Falls through to the fallback below.
  }

  return { steps: fallbackSteps(alone), source: "fallback" };
}
