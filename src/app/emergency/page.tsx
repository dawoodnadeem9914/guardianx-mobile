"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ConfirmationCard } from "@/components/ConfirmationCard";
import { NoEmergencyCard } from "@/components/NoEmergencyCard";
import { classifyEmergency, readAndResizeImage } from "@/services/aiService";
import { saveEmergencyContext } from "@/lib/emergencyContext";
import { useSettings } from "@/lib/settingsContext";
import { useVoiceInput } from "@/lib/useVoiceInput";
import { cn } from "@/lib/utils";
import type { TranslationKey } from "@/lib/i18n";
import type {
  EmergencyClassification,
  EmergencyCategory,
} from "@/types/emergency";

import {
  Mic,
  MicOff,
  Square,
  Keyboard,
  Loader2,
  Camera,
  X,
} from "lucide-react";

type Step = "select" | "voice" | "text" | "analyzing" | "confirm";

const CATEGORY_OPTIONS: {
  category: EmergencyCategory;
  labelKey: TranslationKey;
  icon: string;
  colorClass: string;
  textClass: string;
  borderClass: string;
}[] = [
  {
    category: "medical",
    labelKey: "medicalAmbulance",
    icon: "🚑",
    colorClass: "bg-gradient-to-br from-red-500 to-red-700",
    textClass: "text-white",
    borderClass: "border-red-400",
  },
  {
    category: "police",
    labelKey: "police",
    icon: "👮",
    colorClass: "bg-gradient-to-br from-blue-500 to-blue-700",
    textClass: "text-white",
    borderClass: "border-blue-400",
  },
  {
    category: "fire",
    labelKey: "fireRescue",
    icon: "🔥",
    colorClass: "bg-gradient-to-br from-orange-400 to-orange-600",
    textClass: "text-white",
    borderClass: "border-orange-300",
  },
  {
    category: "unclear",
    labelKey: "notSure",
    icon: "❓",
    colorClass: "bg-gradient-to-br from-purple-500 to-purple-700",
    textClass: "text-white",
    borderClass: "border-purple-400",
  },
];

/**
 * Photo attachment control.
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
        <img
          src={imagePreview}
          alt="Attached photo"
          className="max-h-40 w-full rounded-xl2 object-cover"
        />

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
  const [result, setResult] =
    React.useState<EmergencyClassification | null>(null);
  const [descriptionText, setDescriptionText] = React.useState("");
  const [imageDataUrl, setImageDataUrl] =
    React.useState<string | null>(null);
  const [imageProcessing, setImageProcessing] = React.useState(false);

  const [unsureMode, setUnsureMode] = React.useState(false);

  const recognitionLang =
    settings.language === "ms" ? "ms-MY" : "en-US";

  const {
    transcript: voiceTranscript,
    listening: voiceListening,
    supported: voiceSupported,
    error: voiceError,
    startListening,
    stopListening,
  } = useVoiceInput(recognitionLang);

  React.useEffect(() => {
    if (voiceTranscript) {
      setTextValue(voiceTranscript);
    }
  }, [voiceTranscript]);

  function handleMicToggle() {
    if (voiceListening) {
      stopListening();
    } else {
      startListening();
    }
  }

  async function handleImageSelect(
    e: React.ChangeEvent<HTMLInputElement>
  ) {
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

    const classification = await classifyEmergency(
      description,
      imageDataUrl ?? undefined
    );

    setResult(classification);
    setStep("confirm");
  }

  function handleDirectCategory(
    category: EmergencyCategory,
    label: string
  ) {
    if (category === "unclear") {
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

    saveEmergencyContext({
      description: descriptionText,
      imageDataUrl,
    });

    const params = new URLSearchParams({
      type: result.category,
    });

    router.push(`/emergency/simulation?${params.toString()}`);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header
        title={t("emergencyHelp")}
        showHome
        onBack={() => {
          if (step === "select") {
            router.push("/");
            return;
          }

          setResult(null);
          setUnsureMode(false);
          setTextValue("");
          setDescriptionText("");
          setImageDataUrl(null);
          setStep("select");
        }}
      />

      <div className="flex flex-1 flex-col gap-6 px-6 pb-10">

        {/* ================= SELECT EMERGENCY ================= */}
        {step === "select" && (
          <>
            <div className="text-center">
              <h2 className="text-2xl font-extrabold text-white">
                {t("whatDoYouNeed")}
              </h2>

              <p className="mt-1 text-white/70">
                {t("speakOrChoose")}
              </p>
            </div>

            {/* Speak to GuardianX */}
            <button
              type="button"
              onClick={() => setStep("voice")}
              className="flex min-h-[5rem] items-center justify-center gap-3 rounded-xl2 border-2 border-teal-300 bg-gradient-to-r from-teal-500 to-teal-700 text-2xl font-extrabold text-navy shadow-lg active:scale-[0.98]"
            >
              <Mic size={30} />
              {t("speakToGuardianX")}
            </button>

            {/* Colorful Emergency Options */}
            <div className="grid grid-cols-2 gap-4">

              {CATEGORY_OPTIONS.map((opt) => (
                <button
                  key={opt.category}
                  type="button"
                  onClick={() =>
                    handleDirectCategory(
                      opt.category,
                      t(opt.labelKey)
                    )
                  }
                  className={cn(
                    "flex min-h-[9.5rem] flex-col items-center justify-center rounded-2xl border-2 px-3 py-4 text-center shadow-lg transition-transform active:scale-[0.97]",
                    opt.colorClass,
                    opt.borderClass
                  )}
                >
                  {/* Icon */}
                  <span className="mb-3 text-5xl leading-none drop-shadow-md">
                    {opt.icon}
                  </span>

                  {/* Text */}
                  <span
                    className={cn(
                      "text-lg font-extrabold leading-tight",
                      opt.textClass
                    )}
                  >
                    {t(opt.labelKey)}
                  </span>
                </button>
              ))}

            </div>

            {/* Type instead */}
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

        {/* ================= VOICE ================= */}
        {step === "voice" && (
          <div className="flex flex-1 flex-col gap-6">

            {unsureMode && (
              <div className="rounded-xl2 bg-white/5 p-4 text-center">
                <p className="text-lg font-semibold text-white">
                  {t("tellGuardianX")}
                </p>

                <p className="mt-1 text-sm text-white/60">
                  {t("guidingQuestions")}
                </p>
              </div>
            )}

            <div className="flex flex-col items-center gap-4">

              <button
                type="button"
                onClick={handleMicToggle}
                disabled={!voiceSupported}
                aria-label={
                  voiceListening
                    ? "Stop listening"
                    : "Start listening"
                }
                className={cn(
                  "flex h-28 w-28 items-center justify-center rounded-full text-white shadow-xl transition-transform active:scale-95",

                  !voiceSupported
                    ? "bg-white/10 opacity-50"
                    : voiceListening
                      ? "bg-red-500 animate-pulse"
                      : "bg-teal-500"
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
                {!voiceSupported
                  ? t("voiceNotSupported")
                  : voiceListening
                    ? t("listening")
                    : t("tapToSpeak")}
              </p>

              {voiceError && (
                <p className="text-center text-base text-red-400">
                  {voiceError}
                </p>
              )}
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-lg text-white/80">
                {t("tellGuardianX")}
              </p>

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
              disabled={
                textValue.trim().length < 3 && !imageDataUrl
              }
              onClick={() =>
                handleDescription(textValue.trim())
              }
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

        {/* ================= TEXT ================= */}
        {step === "text" && (
          <div className="flex flex-1 flex-col gap-4">

            <p className="text-lg text-white/80">
              {t("tellGuardianX")}
            </p>

            {unsureMode && (
              <p className="text-sm text-white/60">
                {t("guidingQuestions")}
              </p>
            )}

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
              disabled={
                textValue.trim().length < 3 && !imageDataUrl
              }
              onClick={() =>
                handleDescription(textValue.trim())
              }
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

        {/* ================= ANALYZING ================= */}
        {step === "analyzing" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <Loader2
              size={48}
              className="animate-spin text-teal"
            />

            <p className="text-xl font-semibold text-white">
              {t("analyzing")}
            </p>
          </div>
        )}

        {/* ================= NO EMERGENCY ================= */}
        {step === "confirm" &&
          result &&
          result.category === "none" && (
            <NoEmergencyCard
              onDescribeAgain={() => {
                setResult(null);
                setUnsureMode(false);
                setStep("select");
              }}
            />
          )}

        {/* ================= CONFIRM ================= */}
        {step === "confirm" &&
          result &&
          result.category !== "none" && (
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