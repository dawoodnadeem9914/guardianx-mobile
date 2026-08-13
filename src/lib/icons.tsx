import { Ambulance, ShieldAlert, Flame, HelpCircle, type LucideIcon } from "lucide-react";
import type { EmergencyCategory } from "@/types/emergency";

/**
 * The real, consistent icon system for emergency categories — used
 * everywhere in the app's actual UI chrome (buttons, cards, headers).
 * Emoji are used only for on-map markers (see MAP_MARKER_EMOJI in
 * lib/constants.ts), never as the primary icon system, per the
 * project's explicit "not a collection of random emoji" requirement.
 */
export const EMERGENCY_CATEGORY_ICON: Record<EmergencyCategory, LucideIcon> = {
  medical: Ambulance,
  police: ShieldAlert,
  fire: Flame,
  unclear: HelpCircle,
};

/** Matches the color-coding in the project's visual design spec: medical/police/fire/AI each get a distinct, meaningful color. */
export const EMERGENCY_CATEGORY_COLOR_CLASS: Record<EmergencyCategory, string> = {
  medical: "text-emergency",
  police: "text-blue-400",
  fire: "text-orange-400",
  unclear: "text-purple-400",
};
