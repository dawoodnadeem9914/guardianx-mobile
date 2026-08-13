"use client";

import * as React from "react";
import type { AccessibilitySettings } from "@/types/user";
import {
  getAccessibilitySettings,
  saveAccessibilitySettings,
  DEFAULT_ACCESSIBILITY,
} from "@/services/settingsService";
import { translate, type TranslationKey } from "@/lib/i18n";

/**
 * The single, real, shared source of truth for accessibility settings
 * and language — this is what actually fixes "changing a setting
 * requires a refresh." Previously, AccessibilityProvider read
 * localStorage once in a useEffect with an empty dependency array,
 * and the Settings page held its own separate useState — the two
 * never communicated, so a change only ever took effect on the next
 * full page load. Now there is exactly one React state (this
 * context), every consumer re-renders the instant it changes, and the
 * CSS classes on <html> are applied in the SAME effect that reacts to
 * state changes (not just on mount), so visual effects like large
 * text and high contrast update immediately too.
 */

interface SettingsContextValue {
  settings: AccessibilitySettings;
  updateSettings: (partial: Partial<AccessibilitySettings>) => void;
  /** Real translation lookup using the current language — see lib/i18n.ts. */
  t: (key: TranslationKey) => string;
}

const SettingsContext = React.createContext<SettingsContextValue | null>(null);

export function SettingsProvider({ children }: { children: React.ReactNode }) {
  // Starts at the same default on server and initial client render
  // (matching, so no hydration mismatch), then loads the real saved
  // value from localStorage in an effect — localStorage genuinely
  // doesn't exist during SSR, so this can only be known after mount.
  const [settings, setSettings] = React.useState<AccessibilitySettings>(DEFAULT_ACCESSIBILITY);

  React.useEffect(() => {
    setSettings(getAccessibilitySettings());
  }, []);

  // Applies the real CSS classes every time settings genuinely
  // change (not just once on mount) — this is what makes Large Text/
  // High Contrast/Reduced Animation visible immediately, on whatever
  // page is currently open, without a refresh.
  React.useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("large-text", settings.largeText);
    root.classList.toggle("high-contrast", settings.highContrast);
    root.classList.toggle("reduce-motion", settings.reducedAnimation);
    root.lang = settings.language;
  }, [settings]);

  const updateSettings = React.useCallback((partial: Partial<AccessibilitySettings>) => {
    setSettings((prev) => {
      const next = { ...prev, ...partial };
      saveAccessibilitySettings(next);
      return next;
    });
  }, []);

  const t = React.useCallback(
    (key: TranslationKey) => translate(key, settings.language),
    [settings.language]
  );

  const value = React.useMemo(
    () => ({ settings, updateSettings, t }),
    [settings, updateSettings, t]
  );

  return <SettingsContext.Provider value={value}>{children}</SettingsContext.Provider>;
}

export function useSettings(): SettingsContextValue {
  const ctx = React.useContext(SettingsContext);
  if (!ctx) {
    throw new Error("useSettings() must be used within <SettingsProvider>.");
  }
  return ctx;
}
