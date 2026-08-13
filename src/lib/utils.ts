/** Haversine great-circle distance in kilometers between two real coordinates. */
export function distanceKm(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Scales a real-feeling distance into a short, watchable demo
 * countdown (in seconds), clamped to a sensible range — never makes
 * anyone wait the real ETA, and never claims the countdown itself is
 * a real dispatch feed.
 */
export function scaleToDemoSeconds(minutes: number, min: number, max: number): number {
  const scaled = Math.round(minutes * 2.2);
  return Math.min(max, Math.max(min, scaled));
}

export function cn(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(" ");
}

/** True only for a real, well-formed tel: capable phone string — kept lenient since real users type numbers inconsistently. */
export function isLikelyPhoneNumber(value: string): boolean {
  return /^[+0-9\s-]{6,}$/.test(value.trim());
}

export function telHref(phone: string): string {
  return `tel:${phone.replace(/[\s-]/g, "")}`;
}

/**
 * Generates a random-enough identifier for on-device-only records
 * (e.g. a localStorage family contact before GuardianX is connected).
 * NEVER used for anything security-sensitive — real Supabase rows
 * always get their id from the database itself (see familyService.ts),
 * never from this function.
 *
 * crypto.randomUUID() requires a secure context (HTTPS, or localhost)
 * per the Web Crypto API spec. Testing over a plain http:// LAN IP
 * (e.g. http://192.168.1.2:3000, a common way to test on a real phone
 * during development) is NOT a secure context, so crypto.randomUUID
 * can be genuinely undefined there even though the exact same browser
 * has it when the same app is opened over HTTPS. This falls through
 * to crypto.getRandomValues (marginally more available) and finally a
 * plain Math.random()-based id — which is entirely appropriate here
 * specifically because this value is never used for authentication,
 * authorization, or anything sent to a server.
 */
export function generateLocalId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  if (typeof crypto !== "undefined" && typeof crypto.getRandomValues === "function") {
    const bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 0x0f) | 0x40;
    bytes[8] = (bytes[8] & 0x3f) | 0x80;
    const hex = Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
    return `${hex.slice(0, 8)}-${hex.slice(8, 12)}-${hex.slice(12, 16)}-${hex.slice(16, 20)}-${hex.slice(20)}`;
  }
  return `local-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}