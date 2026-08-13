"use client";

import * as React from "react";
import { EMERGENCY_NUMBER } from "@/lib/constants";
import { EMERGENCY_CATEGORY_ICON, EMERGENCY_CATEGORY_COLOR_CLASS } from "@/lib/icons";
import { useSettings } from "@/lib/settingsContext";
import { CheckCircle2, XCircle } from "lucide-react";
import type { EmergencyCategory } from "@/types/emergency";

export function ConfirmationCard({
  category,
  label,
  onConfirm,
  onCancel,
}: {
  category: EmergencyCategory;
  label: string;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  const { settings, t } = useSettings();
  const Icon = EMERGENCY_CATEGORY_ICON[category];

  React.useEffect(() => {
    // Real Voice Guidance behavior — the confirmation screen is
    // exactly the kind of "important message" this setting is meant
    // to cover, so it's read aloud automatically when the setting is
    // on, using the same real SpeechSynthesis API as GuidanceCard.
    if (!settings.voiceGuidance) return;
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;

    const utterance = new SpeechSynthesisUtterance(
      `${label}. ${t("weRecommendCalling")} ${t("emergencyNumberLabel")} ${EMERGENCY_NUMBER}.`
    );
    utterance.lang = settings.language === "ms" ? "ms-MY" : "en-US";
    window.speechSynthesis.speak(utterance);

    return () => window.speechSynthesis.cancel();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [settings.voiceGuidance, settings.language, label]);

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl2 bg-white/5 p-6 text-center shadow-xl">
      <Icon size={64} className={EMERGENCY_CATEGORY_COLOR_CLASS[category]} />
      <h2 className="text-2xl font-extrabold text-white">{label}</h2>
      <p className="text-lg text-white/80">{t("weRecommendCalling")}</p>
      <p className="text-xl font-bold text-teal-soft">
        {t("emergencyNumberLabel")}: {EMERGENCY_NUMBER}
      </p>

      <div className="mt-2 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onConfirm}
          className="flex min-h-[5rem] items-center justify-center gap-2 rounded-xl2 bg-safe text-2xl font-extrabold text-white shadow-lg active:scale-[0.98]"
        >
          <CheckCircle2 size={26} />
          {t("callNow")} {EMERGENCY_NUMBER}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-[4rem] items-center justify-center gap-2 rounded-xl2 border-2 border-white/20 text-xl font-bold text-white active:scale-[0.98]"
        >
          <XCircle size={22} />
          {t("cancel")}
        </button>
      </div>
    </div>
  );
}
