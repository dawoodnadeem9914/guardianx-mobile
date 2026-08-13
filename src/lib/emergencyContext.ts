/**
 * Transient handoff of the real emergency description/image from the
 * classification step (/emergency) to the guidance step
 * (/emergency/simulation) — sessionStorage rather than a URL query
 * param specifically because a real photo's base64 data URL can be
 * far larger than practical URL length limits. Cleared automatically
 * when the browser tab closes; never sent anywhere on its own.
 */

const KEY = "guardianx-mobile:emergency-context";

export interface EmergencyContext {
  description: string;
  imageDataUrl: string | null;
}

export function saveEmergencyContext(context: EmergencyContext): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.setItem(KEY, JSON.stringify(context));
  } catch {
    // If storage is full (a large image can be a few hundred KB) or
    // unavailable, guidance simply falls back to category-only —
    // never a crash.
  }
}

export function readEmergencyContext(): EmergencyContext {
  const empty: EmergencyContext = { description: "", imageDataUrl: null };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.sessionStorage.getItem(KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}
