"use client";

import { Mic, MicOff, Square } from "lucide-react";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { useSettings } from "@/lib/settingsContext";
import { cn } from "@/lib/utils";

/**
 * Real microphone input via the browser's SpeechRecognition API where
 * supported — never a fake "Listening…" timer. Where unsupported
 * (e.g. Firefox has no built-in support), the mic is clearly disabled
 * with an honest message, and text input keeps working.
 *
 * Recognition language follows the app's real selected language
 * (en-US / ms-MY). Malay speech recognition support genuinely varies
 * by browser/device — where it isn't supported, the same honest
 * "voice isn't supported" state applies rather than silently falling
 * back to English recognition.
 */
export function VoiceAssistant({
  onFinalTranscript,
}: {
  onFinalTranscript: (text: string) => void;
}) {
  const { settings, t } = useSettings();
  const recognitionLang = settings.language === "ms" ? "ms-MY" : "en-US";
  const { transcript, listening, supported, error, startListening, stopListening } =
    useVoiceInput(recognitionLang);

  function handleToggle() {
    if (listening) {
      stopListening();
      if (transcript.trim()) onFinalTranscript(transcript.trim());
    } else {
      startListening();
    }
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <button
        type="button"
        onClick={handleToggle}
        disabled={!supported}
        aria-label={listening ? "Stop listening" : "Start listening"}
        className={cn(
          "flex h-28 w-28 items-center justify-center rounded-full text-white shadow-xl transition-transform active:scale-95",
          !supported ? "bg-white/10 opacity-50" : listening ? "bg-emergency animate-pulse" : "bg-teal"
        )}
      >
        {!supported ? <MicOff size={44} /> : listening ? <Square size={36} /> : <Mic size={44} />}
      </button>

      <p className="text-lg font-semibold text-white/90">
        {!supported ? t("voiceNotSupported") : listening ? t("listening") : t("tapToSpeak")}
      </p>

      {transcript && (
        <div className="w-full rounded-xl2 bg-white/10 p-4">
          <p className="text-sm text-white/60">{t("youSaid")}</p>
          <p className="mt-1 text-lg text-white">{transcript}</p>
        </div>
      )}

      {error && <p className="text-center text-base text-emergency-strong">{error}</p>}
    </div>
  );
}
