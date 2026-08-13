import type { EmergencyCategory } from "@/types/emergency";
import type { Hospital } from "@/types/hospital";

/**
 * Official Malaysian emergency number. Kept in exactly one place —
 * every screen that shows or dials an emergency number reads from
 * here, never a hardcoded literal scattered through the codebase.
 * Malaysia uses a single unified emergency number (999) for police,
 * fire & rescue, and medical/ambulance — this is real, official
 * information, not invented.
 */
export const EMERGENCY_NUMBER = "999";

export const EMERGENCY_CATEGORY_LABELS: Record<EmergencyCategory, string> = {
  medical: "Medical Emergency",
  police: "Police Emergency",
  fire: "Fire Emergency",
  unclear: "Emergency",
};

/**
 * Small emoji glyphs used ONLY for on-map markers (rendered as plain
 * text inside a Leaflet divIcon, where a real pictorial glyph is
 * genuinely the right tool). Everywhere else in the UI — buttons,
 * headers, cards — uses the real lucide-react icon system in
 * lib/icons.tsx instead, per the project's "no emoji-only UI" rule.
 */
export const MAP_MARKER_EMOJI: Record<EmergencyCategory, string> = {
  medical: "🚑",
  police: "🚓",
  fire: "🚒",
  unclear: "❓",
};

/**
 * A small, honest, LOCAL list of real, named Malaysian hospitals with
 * approximate real coordinates — used only to compute a genuinely
 * calculated "nearest hospital" against the user's REAL location for
 * this first, mock-data version. This is NOT a live hospital-search
 * API and carries no real-time availability information — every
 * screen that shows a result from this list must clearly label it as
 * part of the simulation. See hospitalService.ts.
 */
export const MOCK_HOSPITALS: Hospital[] = [
  { id: "hkl", name: "Hospital Kuala Lumpur", latitude: 3.1729, longitude: 101.7028 },
  { id: "hsa", name: "Hospital Selayang", latitude: 3.2685, longitude: 101.6489 },
  { id: "hct", name: "Hospital Sungai Buloh", latitude: 3.2077, longitude: 101.5497 },
  { id: "hpg", name: "Hospital Ampang", latitude: 3.1478, longitude: 101.7649 },
  { id: "uhkl", name: "University Malaya Medical Centre", latitude: 3.1191, longitude: 101.6538 },
  { id: "gh-shah-alam", name: "Hospital Shah Alam", latitude: 3.0733, longitude: 101.5185 },
];

/** Demo-mode ambulance speed used only to compute a simulated ETA — never presented as a real dispatch feed. */
export const SIMULATED_AMBULANCE_SPEED_KMH = 40;

export const SIM_MIN_SECONDS = 20;
export const SIM_MAX_SECONDS = 60;
