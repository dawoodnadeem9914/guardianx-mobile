import type { EmergencyClassification } from "@/types/emergency";

/**
 * Tries real GPT-4.1 mini classification first, via the server-only
 * /api/ai/classify-emergency route (OPENAI_API_KEY never reaches the
 * browser). Falls back to a safe, deterministic local classifier for
 * ANY reason the real path doesn't work: no API key configured,
 * network failure, timeout, or a malformed response. The app never
 * crashes and never leaves the user without a recommendation — see
 * requirement 6 (safe fallback if AI is unavailable).
 */
export async function classifyEmergency(
  description: string,
  imageDataUrl?: string
): Promise<EmergencyClassification> {
  try {
    const response = await fetch("/api/ai/classify-emergency", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ description, imageDataUrl }),
    });
    const json = (await response.json()) as {
      success: boolean;
      result?: EmergencyClassification;
    };
    if (json.success && json.result) {
      return json.result;
    }
  } catch {
    // Falls through to the local fallback below.
  }

  return classifyLocally(description);
}

/**
 * Reads a real image file, downsizes it if larger than 1280px on its
 * longest side, and re-encodes it as a real JPEG data URL — the exact
 * same real, proven technique used elsewhere in the GuardianX project
 * to keep the payload a small, predictable size (avoiding the
 * "Invalid base64 image_url" failure mode a large, unbounded photo
 * can otherwise cause).
 */
export function readAndResizeImage(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Couldn't read the selected image."));
    reader.onload = () => {
      const rawDataUrl = reader.result;
      if (typeof rawDataUrl !== "string") {
        reject(new Error("Couldn't read the selected image."));
        return;
      }

      const img = new Image();
      img.onerror = () => reject(new Error("That file doesn't look like a valid image."));
      img.onload = () => {
        const MAX_DIMENSION = 1280;
        const scale = Math.min(1, MAX_DIMENSION / Math.max(img.width, img.height));
        const width = Math.max(1, Math.round(img.width * scale));
        const height = Math.max(1, Math.round(img.height * scale));

        const canvas = document.createElement("canvas");
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Couldn't process the selected image."));
          return;
        }
        ctx.drawImage(img, 0, 0, width, height);

        try {
          resolve(canvas.toDataURL("image/jpeg", 0.85));
        } catch {
          reject(new Error("Couldn't process the selected image."));
        }
      };
      img.src = rawDataUrl;
    };
    reader.readAsDataURL(file);
  });
}

interface KeywordProfile {
  category: EmergencyClassification["category"];
  label: string;
  keywords: string[];
}

const PROFILES: KeywordProfile[] = [
  {
    category: "medical",
    label: "Medical Emergency",
    keywords: [
      "fell", "fall", "not responding", "unconscious", "breathing", "chest pain",
      "bleeding", "hurt", "injured", "sick", "pain", "ambulance", "collapsed",
      "stroke", "seizure", "allergic", "choking",
    ],
  },
  {
    category: "police",
    label: "Police Emergency",
    keywords: [
      "break in", "breaking in", "robbery", "stolen", "theft", "attack", "assault",
      "gun", "knife", "threat", "police", "danger", "someone is here", "stranger",
    ],
  },
  {
    category: "fire",
    label: "Fire Emergency",
    keywords: ["fire", "smoke", "burning", "flames", "explosion", "gas leak"],
  },
];

/**
 * Deterministic keyword classifier — the safe fallback. Same
 * "same input, same result" discipline used throughout the GuardianX
 * website's own simulated-fallback logic.
 */
export function classifyLocally(description: string): EmergencyClassification {
  const lower = description.toLowerCase();
  let best: KeywordProfile | null = null;
  let bestScore = 0;

  for (const profile of PROFILES) {
    const score = profile.keywords.reduce((count, kw) => (lower.includes(kw) ? count + 1 : count), 0);
    if (score > bestScore) {
      best = profile;
      bestScore = score;
    }
  }

  if (!best) {
    return {
      category: "none",
      label: "No Emergency Detected",
      confidence: 30,
      reason: "We couldn't clearly tell what kind of help you need from that description.",
      source: "fallback",
    };
  }

  return {
    category: best.category,
    label: best.label,
    confidence: Math.min(90, 55 + bestScore * 10),
    reason: `This sounds like a ${best.label.toLowerCase()}.`,
    source: "fallback",
  };
}