import type { AccessibilitySettings, MedicalInfo, UserProfile } from "@/types/user";
import { getSupabaseClient } from "@/lib/supabase";

const ACCESSIBILITY_KEY = "guardianx-mobile:accessibility";
const MEDICAL_KEY = "guardianx-mobile:medical-info";
const PROFILE_KEY = "guardianx-mobile:profile";

export const DEFAULT_ACCESSIBILITY: AccessibilitySettings = {
  largeText: false,
  highContrast: false,
  voiceGuidance: false,
  reducedAnimation: false,
  language: "en",
};

// Accessibility stays localStorage-only on purpose — it's a
// per-device display preference, not account data, and must keep
// working identically whether or not the user has connected to
// GuardianX (the whole "no account required" experience depends on
// settings like this working immediately).
export function getAccessibilitySettings(): AccessibilitySettings {
  if (typeof window === "undefined") return DEFAULT_ACCESSIBILITY;
  try {
    const raw = window.localStorage.getItem(ACCESSIBILITY_KEY);
    return raw ? { ...DEFAULT_ACCESSIBILITY, ...JSON.parse(raw) } : DEFAULT_ACCESSIBILITY;
  } catch {
    return DEFAULT_ACCESSIBILITY;
  }
}

export function saveAccessibilitySettings(settings: AccessibilitySettings): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(ACCESSIBILITY_KEY, JSON.stringify(settings));
}

async function getRealUserId(): Promise<string | null> {
  const supabase = getSupabaseClient();
  if (!supabase) return null;
  const {
    data: { session },
  } = await supabase.auth.getSession();
  return session?.user.id ?? null;
}

const EMPTY_MEDICAL_INFO: MedicalInfo = {
  name: "",
  age: "",
  bloodType: "",
  allergies: "",
  conditions: "",
  otherInfo: "",
};

const VALID_BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-", "unknown"];

/** medical_profiles has no separate "age" column — an approximate date_of_birth (Jan 1 of the birth year) is stored instead, and age is derived back from it on read. Never presented as a precise birthdate. */
function ageToApproximateDob(age: string): string | null {
  const years = parseInt(age, 10);
  if (!Number.isFinite(years) || years <= 0 || years > 130) return null;
  const birthYear = new Date().getFullYear() - years;
  return `${birthYear}-01-01`;
}

function dobToApproximateAge(dob: string | null): string {
  if (!dob) return "";
  const birthYear = new Date(dob).getFullYear();
  if (!Number.isFinite(birthYear)) return "";
  return String(new Date().getFullYear() - birthYear);
}

function readLocalMedicalInfo(): MedicalInfo {
  if (typeof window === "undefined") return EMPTY_MEDICAL_INFO;
  try {
    const raw = window.localStorage.getItem(MEDICAL_KEY);
    return raw ? { ...EMPTY_MEDICAL_INFO, ...JSON.parse(raw) } : EMPTY_MEDICAL_INFO;
  } catch {
    return EMPTY_MEDICAL_INFO;
  }
}

function writeLocalMedicalInfo(info: MedicalInfo): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(MEDICAL_KEY, JSON.stringify(info));
}

/**
 * Real Supabase-backed medical info — reuses the EXISTING
 * medical_profiles table from the GuardianX website (migration 0002),
 * no duplicate table. Falls back to localStorage only when there's no
 * real Supabase session yet, preserving "no account required."
 */
export async function getMedicalInfo(): Promise<MedicalInfo> {
  const userId = await getRealUserId();
  if (!userId) return readLocalMedicalInfo();

  const supabase = getSupabaseClient()!;
  const { data, error } = await supabase
    .from("medical_profiles")
    .select("full_name, date_of_birth, blood_type, allergies, conditions, notes")
    .eq("user_id", userId)
    .maybeSingle();

  if (error || !data) return EMPTY_MEDICAL_INFO;

  return {
    name: data.full_name ?? "",
    age: dobToApproximateAge(data.date_of_birth),
    bloodType: data.blood_type === "unknown" ? "" : (data.blood_type ?? ""),
    allergies: data.allergies ?? "",
    conditions: data.conditions ?? "",
    otherInfo: data.notes ?? "",
  };
}

export interface SaveMedicalInfoResult {
  success: boolean;
  error?: string;
}

export async function saveMedicalInfo(info: MedicalInfo): Promise<SaveMedicalInfoResult> {
  const userId = await getRealUserId();

  if (!userId) {
    writeLocalMedicalInfo(info);
    return { success: true };
  }

  const bloodType = VALID_BLOOD_TYPES.includes(info.bloodType) ? info.bloodType : "unknown";

  const supabase = getSupabaseClient()!;
  const { error } = await supabase.from("medical_profiles").upsert(
    {
      user_id: userId,
      full_name: info.name.trim() || "GuardianX user",
      date_of_birth: ageToApproximateDob(info.age),
      blood_type: bloodType,
      allergies: info.allergies.trim() || null,
      conditions: info.conditions.trim() || null,
      notes: info.otherInfo.trim() || null,
    },
    { onConflict: "user_id" }
  );

  if (error) {
    return { success: false, error: error.message };
  }
  return { success: true };
}

/**
 * Bug #3 fix: moves any medical information entered on-device BEFORE the
 * user connected to GuardianX into the real, shared medical_profiles table,
 * once a real Supabase session exists.
 *
 * Safe to call every time a connection is detected (connect/page.tsx does
 * exactly that): medical_profiles.user_id is unique, so this checks for an
 * existing row first and NEVER overwrites it — website/Supabase data always
 * wins. Only writes local data into Supabase when no row exists yet at all,
 * matching what saveMedicalInfo's own upsert would otherwise silently
 * clobber if called blindly.
 *
 * The local cache is cleared once this has run to a safe conclusion either
 * way (migrated, or skipped because Supabase already has data) — so that a
 * later disconnect never shows a stale pre-migration snapshot instead of
 * the real (possibly since-updated) Supabase data. Re-running this after
 * the cache is empty is a genuine no-op, making it safe to call on every
 * reconnect.
 */
export async function migrateLocalMedicalInfoToSupabase(userId: string): Promise<void> {
  const local = readLocalMedicalInfo();
  const hasLocalData =
    local.name.trim() ||
    local.age.trim() ||
    local.bloodType.trim() ||
    local.allergies.trim() ||
    local.conditions.trim() ||
    local.otherInfo.trim();

  if (!hasLocalData) return;

  const supabase = getSupabaseClient();
  if (!supabase) return;

  const { data: existingRow, error: fetchError } = await supabase
    .from("medical_profiles")
    .select("user_id")
    .eq("user_id", userId)
    .maybeSingle();

  if (fetchError) {
    console.warn("[settingsService] Migration: couldn't check existing medical profile:", fetchError.message);
    return;
  }

  if (existingRow) {
    // A Supabase medical profile already exists — it wins. Don't touch it,
    // but the stale local snapshot is no longer relevant, so clear it.
    writeLocalMedicalInfo(EMPTY_MEDICAL_INFO);
    return;
  }

  const bloodType = VALID_BLOOD_TYPES.includes(local.bloodType) ? local.bloodType : "unknown";

  const { error: insertError } = await supabase.from("medical_profiles").insert({
    user_id: userId,
    full_name: local.name.trim() || "GuardianX user",
    date_of_birth: ageToApproximateDob(local.age),
    blood_type: bloodType,
    allergies: local.allergies.trim() || null,
    conditions: local.conditions.trim() || null,
    notes: local.otherInfo.trim() || null,
  });

  if (insertError) {
    console.warn("[settingsService] Migration: couldn't insert medical profile:", insertError.message);
    // Leave local data intact so nothing is lost — will retry next connect.
    return;
  }

  writeLocalMedicalInfo(EMPTY_MEDICAL_INFO);
}

export function getUserProfile(): UserProfile {
  const empty: UserProfile = { name: "", age: "", language: "en" };
  if (typeof window === "undefined") return empty;
  try {
    const raw = window.localStorage.getItem(PROFILE_KEY);
    return raw ? { ...empty, ...JSON.parse(raw) } : empty;
  } catch {
    return empty;
  }
}

export function saveUserProfile(profile: UserProfile): void {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(PROFILE_KEY, JSON.stringify(profile));
}