"use client";

import * as React from "react";
import { CheckCircle2, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useSettings } from "@/lib/settingsContext";

/** True only if the real browser SpeechSynthesis API exists — used to read guidance aloud. Real Web API, not simulated. */
function isSpeechSynthesisSupported(): boolean {
  return typeof window !== "undefined" && "speechSynthesis" in window;
}

export function GuidanceCard({
  step,
  totalSteps,
  text,
  onNext,
  onClose,
  isLast,
  aiGenerated,
}: {
  step: number;
  totalSteps: number;
  text: string;
  onNext: () => void;
  onClose: () => void;
  isLast: boolean;
  /** True only when this step genuinely came from the real AI guidance call — never claimed when it's the generic fallback. */
  aiGenerated: boolean;
}) {
  const { settings, t } = useSettings();
  const [speaking, setSpeaking] = React.useState(false);
  // Same reasoning as settings/notifications/page.tsx — starts true
  // (matching the server render) and is corrected in an effect, never
  // computed directly during render (which would read `window` and
  // genuinely differ between the server and the client's first paint).
  const [supported, setSupported] = React.useState(true);
  React.useEffect(() => {
    setSupported(isSpeechSynthesisSupported());
  }, []);

  function speak() {
    if (!supported) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = settings.language === "ms" ? "ms-MY" : "en-US";
    utterance.onend = () => setSpeaking(false);
    utterance.onerror = () => setSpeaking(false);
    window.speechSynthesis.speak(utterance);
    setSpeaking(true);
  }

  function toggleReadAloud() {
    if (speaking) {
      window.speechSynthesis.cancel();
      setSpeaking(false);
      return;
    }
    speak();
  }

  React.useEffect(() => {
    // Real behavior change from the Voice Guidance setting — when on,
    // each guidance step is read aloud automatically the moment it's
    // shown, not just available on manual tap. This is what makes the
    // setting genuinely do something, not just exist as a label.
    if (settings.voiceGuidance && supported) {
      speak();
    }
    // Stop any in-progress speech when the step changes or the card closes.
    return () => {
      if (supported) window.speechSynthesis.cancel();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [text, supported, settings.voiceGuidance]);

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
      <div className="w-full max-w-md rounded-xl2 bg-navy-raised p-6 shadow-2xl">
        <div className="flex items-center justify-between">
          <p className="text-sm font-semibold uppercase tracking-wide text-teal-soft">
            Step {step} of {totalSteps}
          </p>
          {aiGenerated ? (
            <span className="flex items-center gap-1 rounded-full bg-purple-500/20 px-2.5 py-1 text-xs font-bold text-purple-300">
              <Sparkles size={12} />
              AI
            </span>
          ) : (
            <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-bold text-white/60">
              General guidance
            </span>
          )}
        </div>

        <div className="mt-3 flex items-start gap-3">
          <CheckCircle2 size={26} className="mt-0.5 shrink-0 text-safe" />
          <p className="text-xl font-semibold text-white">{text}</p>
        </div>

        {supported && (
          <button
            type="button"
            onClick={toggleReadAloud}
            className="mt-3 flex items-center gap-2 text-sm font-semibold text-teal-soft"
          >
            {speaking ? <VolumeX size={16} /> : <Volume2 size={16} />}
            {speaking ? t("stopReading") : t("readAloud")}
          </button>
        )}

        <p className="mt-4 text-sm text-white/60">{t("generalGuidance")}</p>
        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[3.5rem] flex-1 rounded-xl2 border-2 border-white/20 text-lg font-bold text-white"
          >
            Close
          </button>
          <button
            type="button"
            onClick={onNext}
            className="min-h-[3.5rem] flex-1 rounded-xl2 bg-teal text-lg font-bold text-navy"
          >
            {isLast ? "Done" : "Next"}
          </button>
        </div>
      </div>
    </div>
  );
}