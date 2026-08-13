"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { EmergencyTypeCard } from "@/components/EmergencyTypeCard";
import { ConfirmationCard } from "@/components/ConfirmationCard";
import { NoEmergencyCard } from "@/components/NoEmergencyCard";
import { classifyEmergency, readAndResizeImage } from "@/services/aiService";
import { saveEmergencyContext } from "@/lib/emergencyContext";
import { EMERGENCY_CATEGORY_ICON, EMERGENCY_CATEGORY_COLOR_CLASS } from "@/lib/icons";
import { useSettings } from "@/lib/settingsContext";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import type { EmergencyClassification, EmergencyCategory } from "@/types/emergency";
import { Mic, MicOff, Square, Keyboard, Loader2, Camera, X } from "lucide-react";

type Step = "select" | "voice" | "text" | "analyzing" | "confirm";

const CATEGORY_OPTIONS: { category: EmergencyCategory; labelKey: TranslationKey }[] = [
  { category: "medical", labelKey: "medicalAmbulance" },
  { category: "police", labelKey: "police" },
  { category: "fire", labelKey: "fireRescue" },
  { category: "unclear", labelKey: "notSure" },
];

/**
 * Real photo attach control — shared by both the voice and text
 * steps. `capture="environment"` is a real, standard HTML attribute
 * that opens the device's actual camera directly on mobile browsers
 * that support it, while still degrading gracefully to a normal file
 * picker (including the gallery) everywhere else. The captured/picked
 * file is genuinely read, downsized, and re-encoded — see
 * aiService.readAndResizeImage — never faked.
 */
function PhotoAttach({
  imagePreview,
  processing,
  onSelect,
  onRemove,
}: {
  imagePreview: string | null;
  processing: boolean;
  onSelect: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemove: () => void;
}) {
  const { t } = useSettings();

  if (imagePreview) {
    return (
      <div className="relative w-full">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={imagePreview} alt="Attached photo" className="max-h-40 w-full rounded-xl2 object-cover" />
        <button
          type="button"
          onClick={onRemove}
          aria-label="Remove photo"
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-black/60 text-white"
        >
          <X size={18} />
        </button>
      </div>
    );
  }

  return (
    <label className="flex min-h-[3.5rem] w-full cursor-pointer items-center justify-center gap-2 rounded-xl2 border-2 border-dashed border-white/20 text-lg font-semibold text-white/70">
      {processing ? (
        <>
          <Loader2 size={20} className="animate-spin" />
          {t("readingPhoto")}
        </>
      ) : (
        <>
          <Camera size={22} />
          {t("addPhoto")}
        </>
      )}
      <input
        type="file"
        accept="image/*"
        capture="environment"
        onChange={onSelect}
        disabled={processing}
        className="sr-only"
      />
    </label>
  );
}

export default function EmergencyPage() {
  const router = useRouter();
  const { t, settings } = useSettings();
  const [step, setStep] = React.useState<Step>("select");
  const [textValue, setTextValue] = React.useState("");
  const [result, setResult] = React.useState<EmergencyClassification | null>(null);
  const [descriptionText, setDescriptionText] = React.useState("");
  const [imageDataUrl, setImageDataUrl] = React.useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = React.useState(false);
  // True only when the user tapped "I'm not sure" — shows the AI's
  // guiding questions instead of the generic prompt, but reuses the
  // exact same real voice/text → real AI classification path either
  // way (no separate, fake "AI is asking questions" mechanism).
  const [unsureMode, setUnsureMode] = React.useState(false);

  // Real microphone input via the browser's SpeechRecognition API — the
  // SAME hook used by VoiceAssistant elsewhere in the app (family
  // messaging), reused directly here rather than through that
  // component so the recognized text can be captured into `textValue`
  // for the user to review/edit, instead of being sent anywhere
  // automatically. `transcript` keeps its last value even after
  // recognition ends on its own (continuous=false means it can stop
  // itself the moment the user pauses) — that's what makes "You said:
  // hello hello" stay on screen, and now also what lets it reach the
  // SEND TO AI button below instead of being silently dropped.
  const recognitionLang = settings.language === "ms" ? "ms-MY" : "en-US";
  const {
    transcript: voiceTranscript,
    listening: voiceListening,
    supported: voiceSupported,
    error: voiceError,
    startListening,
    stopListening,
  } = useVoiceInput(recognitionLang);

  React.useEffect(() => {
    if (voiceTranscript) setTextValue(voiceTranscript);
  }, [voiceTranscript]);

  function handleMicToggle() {
    if (voiceListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  async function handleImageSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      e.target.value = "";
      return;
    }
    setImageProcessing(true);
    try {
      const resized = await readAndResizeImage(file);
      setImageDataUrl(resized);
    } catch {
      setImageDataUrl(null);
    } finally {
      setImageProcessing(false);
      e.target.value = "";
    }
  }

  async function handleDescription(description: string) {
    setStep("analyzing");
    setDescriptionText(description);
    const classification = await classifyEmergency(description, imageDataUrl ?? undefined);
    setResult(classification);
    setStep("confirm");
  }

  function handleDirectCategory(category: EmergencyCategory, label: string) {
    if (category === "unclear") {
      // "I'm not sure" no longer confirms "unclear" directly — it
      // routes into the real voice/text step (with the AI's guiding
      // questions shown), so the real AI classification actually
      // determines the category from what the user says.
      setUnsureMode(true);
      setStep("voice");
      return;
    }
    setResult({
      category,
      label,
      confidence: 100,
      reason: "You chose this directly.",
      source: "fallback",
    });
    setStep("confirm");
  }

  function handleConfirm() {
    if (!result) return;
    saveEmergencyContext({ description: descriptionText, imageDataUrl });
    const params = new URLSearchParams({ type: result.category });
    router.push(`/emergency/simulation?${params.toString()}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("emergencyHelp")} showHome />

      <div className="flex flex-1 flex-col gap-6 px-6 pb-10">
        {step === "select" && (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-white">{t("whatDoYouNeed")}</h2>
              <p className="mt-1 text-white/70">{t("speakOrChoose")}</p>
            </div>

            <button
              type="button"
              onClick={() => setStep("voice")}
              className="flex min-h-[5rem] items-center justify-center gap-3 rounded-xl2 bg-teal text-2xl font-extrabold text-navy shadow-lg active:scale-[0.98]"
            >
              <Mic size={28} />
              {t("speakToGuardianX")}
            </button>

            <div className="grid grid-cols-2 gap-3">
              {CATEGORY_OPTIONS.map((opt) => (
                <EmergencyTypeCard
                  key={opt.category}
                  icon={EMERGENCY_CATEGORY_ICON[opt.category]}
                  colorClass={EMERGENCY_CATEGORY_COLOR_CLASS[opt.category]}
                  label={t(opt.labelKey)}
                  onClick={() => handleDirectCategory(opt.category, t(opt.labelKey))}
                />
              ))}
            </div>

            <button
              type="button"
              onClick={() => setStep("text")}
              className="flex items-center justify-center gap-2 text-lg font-semibold text-white/70 underline"
            >
              <Keyboard size={20} />
              {t("typeInstead")}
            </button>
          </>
        )}

        {step === "voice" && (
          <div className="flex flex-1 flex-col gap-6">
            {unsureMode && (
              <div className="rounded-xl2 bg-white/5 p-4 text-center">
                <p className="text-lg font-semibold text-white">{t("tellGuardianX")}</p>
                <p className="mt-1 text-sm text-white/60">{t("guidingQuestions")}</p>
              </div>
            )}

            <div className="flex flex-col items-center gap-4">
              <button
                type="button"
                onClick={handleMicToggle}
                disabled={!voiceSupported}
                aria-label={voiceListening ? "Stop listening" : "Start listening"}
                className={cn(
                  "flex h-28 w-28 items-center justify-center rounded-full text-white shadow-xl transition-transform active:scale-95",
                  !voiceSupported
                    ? "bg-white/10 opacity-50"
                    : voiceListening
                      ? "bg-emergency animate-pulse"
                      : "bg-teal"
                )}
              >
                {!voiceSupported ? (
                  <MicOff size={44} />
                ) : voiceListening ? (
                  <Square size={36} />
                ) : (
                  <Mic size={44} />
                )}
              </button>
              <p className="text-lg font-semibold text-white/90">
                {!voiceSupported ? t("voiceNotSupported") : voiceListening ? t("listening") : t("tapToSpeak")}
              </p>
              {voiceError && <p className="text-center text-base text-emergency-strong">{voiceError}</p>}
            </div>

            {/*
              The recognized text lands here, fully editable, instead of
              being sent anywhere on its own. Also works as the manual
              text box for anyone who prefers to type directly here
              rather than tapping "Type instead" below.
            */}
            <div className="flex flex-col gap-2">
              <p className="text-lg text-white/80">{t("tellGuardianX")}</p>
              <textarea
                value={textValue}
                onChange={(e) => setTextValue(e.target.value)}
                rows={4}
                placeholder="e.g. My father fell down and is not responding."
                className="rounded-xl2 bg-white/10 p-4 text-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal"
              />
            </div>

            <PhotoAttach
              imagePreview={imageDataUrl}
              processing={imageProcessing}
              onSelect={handleImageSelect}
              onRemove={() => setImageDataUrl(null)}
            />

            <button
              type="button"
              disabled={textValue.trim().length < 3 && !imageDataUrl}
              onClick={() => handleDescription(textValue.trim())}
              className="min-h-[4rem] rounded-xl2 bg-teal text-xl font-extrabold text-navy disabled:opacity-40"
            >
              {t("sendToAi")}
            </button>

            <button
              type="button"
              onClick={() => setStep("text")}
              className="flex items-center justify-center gap-2 text-lg font-semibold text-white/70 underline"
            >
              <Keyboard size={20} />
              {t("typeInstead")}
            </button>

            <button
              type="button"
              onClick={() => {
                setUnsureMode(false);
                setStep("select");
              }}
              className="text-lg font-semibold text-white/60 underline"
            >
              {t("back")}
            </button>
          </div>
        )}

        {step === "text" && (
          <div className="flex flex-1 flex-col gap-4">
            <p className="text-lg text-white/80">{t("tellGuardianX")}</p>
            {unsureMode && <p className="text-sm text-white/60">{t("guidingQuestions")}</p>}
            <textarea
              value={textValue}
              onChange={(e) => setTextValue(e.target.value)}
              rows={5}
              placeholder="e.g. My father fell down and is not responding."
              className="rounded-xl2 bg-white/10 p-4 text-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <PhotoAttach
              imagePreview={imageDataUrl}
              processing={imageProcessing}
              onSelect={handleImageSelect}
              onRemove={() => setImageDataUrl(null)}
            />
            <button
              type="button"
              disabled={textValue.trim().length < 3 && !imageDataUrl}
              onClick={() => handleDescription(textValue.trim())}
              className="min-h-[4rem] rounded-xl2 bg-teal text-xl font-extrabold text-navy disabled:opacity-40"
            >
              {t("sendToAi")}
            </button>
            <button
              type="button"
              onClick={() => {
                setUnsureMode(false);
                setStep("select");
              }}
              className="text-lg font-semibold text-white/60 underline"
            >
              {t("back")}
            </button>
          </div>
        )}

        {step === "analyzing" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <Loader2 size={48} className="animate-spin text-teal" />
            <p className="text-xl font-semibold text-white">{t("analyzing")}</p>
          </div>
        )}

        {step === "confirm" && result && result.category === "none" && (
          // The real AI classification (or the local fallback) concluded
          // "none" — no apparent emergency. "none" is deliberately not a
          // valid EmergencyCategory (see types/emergency.ts), so it must
          // never be passed to ConfirmationCard, which only ever recommends
          // calling for a real category. NoEmergencyCard is the existing,
          // purpose-built component for exactly this case.
          <NoEmergencyCard
            onDescribeAgain={() => {
              setResult(null);
              setUnsureMode(false);
              setStep("select");
            }}
          />
        )}

        {step === "confirm" && result && result.category !== "none" && (
          <ConfirmationCard
            category={result.category}
            label={result.label}
            onConfirm={handleConfirm}
            onCancel={() => {
              setResult(null);
              setUnsureMode(false);
              setStep("select");
            }}
          />
        )}
      </div>
    </div>
  );
}