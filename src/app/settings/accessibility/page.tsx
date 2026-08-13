"use client";

import * as React from "react";
import { Header } from "@/components/Header";
import { useSettings } from "@/lib/settingsContext";
import type { AccessibilitySettings } from "@/types/user";
import type { LucideIcon } from "lucide-react";
import { Type, Contrast, Volume2, ZapOff, Languages, Check } from "lucide-react";

function Toggle({
  icon: Icon,
  label,
  description,
  checked,
  onChange,
}: {
  icon: LucideIcon;
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      aria-pressed={checked}
      className="flex min-h-[5rem] items-center justify-between gap-4 rounded-xl2 border border-white/10 bg-white/10 p-5 text-left active:scale-[0.99]"
    >
      <div className="flex items-center gap-3.5">
        <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/20 text-teal">
          <Icon size={22} />
        </span>
        <div>
          <p className="text-lg font-bold text-white">{label}</p>
          <p className="text-sm text-white/70">{description}</p>
        </div>
      </div>
      <span
        className={`flex h-9 w-16 shrink-0 items-center rounded-full p-1 transition-colors ${checked ? "justify-end bg-teal" : "justify-start bg-white/20"}`}
      >
        <span className="h-7 w-7 rounded-full bg-white shadow" />
      </span>
    </button>
  );
}

export default function AccessibilitySettingsPage() {
  const { settings, updateSettings, t } = useSettings();

  function update(partial: Partial<AccessibilitySettings>) {
    updateSettings(partial);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("accessibility")} showHome />
      <div className="flex flex-1 flex-col gap-3 px-6 pb-10">
        <Toggle
          icon={Type}
          label={t("largeText")}
          description={t("largeTextDesc")}
          checked={settings.largeText}
          onChange={(v) => update({ largeText: v })}
        />
        <Toggle
          icon={Contrast}
          label={t("highContrast")}
          description={t("highContrastDesc")}
          checked={settings.highContrast}
          onChange={(v) => update({ highContrast: v })}
        />
        <Toggle
          icon={Volume2}
          label={t("voiceGuidance")}
          description={t("voiceGuidanceDesc")}
          checked={settings.voiceGuidance}
          onChange={(v) => update({ voiceGuidance: v })}
        />
        <Toggle
          icon={ZapOff}
          label={t("reducedAnimation")}
          description={t("reducedAnimationDesc")}
          checked={settings.reducedAnimation}
          onChange={(v) => update({ reducedAnimation: v })}
        />

        <div className="mt-2 rounded-xl2 border border-white/10 bg-white/10 p-5">
          <div className="flex items-center gap-3.5">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-teal/20 text-teal">
              <Languages size={22} />
            </span>
            <p className="text-lg font-bold text-white">{t("language")}</p>
          </div>
          <div className="mt-4 flex gap-2">
            <button
              type="button"
              onClick={() => update({ language: "en" })}
              className={`flex min-h-[3.5rem] flex-1 items-center justify-center gap-2 rounded-xl text-lg font-bold ${settings.language === "en" ? "bg-teal text-navy" : "bg-white/10 text-white"}`}
            >
              <span className={settings.language === "en" ? "visible" : "invisible"}>
                <Check size={18} />
              </span>
              {t("english")}
            </button>
            <button
              type="button"
              onClick={() => update({ language: "ms" })}
              className={`flex min-h-[3.5rem] flex-1 items-center justify-center gap-2 rounded-xl text-lg font-bold ${settings.language === "ms" ? "bg-teal text-navy" : "bg-white/10 text-white"}`}
            >
              <span className={settings.language === "ms" ? "visible" : "invisible"}>
                <Check size={18} />
              </span>
              {t("malay")}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
