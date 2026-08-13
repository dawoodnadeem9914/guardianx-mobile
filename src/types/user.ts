export interface AccessibilitySettings {
  largeText: boolean;
  highContrast: boolean;
  voiceGuidance: boolean;
  reducedAnimation: boolean;
  language: "en" | "ms";
}

export interface MedicalInfo {
  name: string;
  /** Simple age input for the mobile UI — stored as an approximate date_of_birth on the shared medical_profiles table (see settingsService.ts), since that table has no separate "age" column. */
  age: string;
  bloodType: string;
  allergies: string;
  conditions: string;
  /** Any other important emergency information — maps directly to medical_profiles.notes. */
  otherInfo: string;
}

export interface UserProfile {
  name: string;
  age: string;
  language: "en" | "ms";
}

export interface GuardianXConnection {
  connected: boolean;
  connectedAt: string | null;
  accountLabel: string | null;
}
