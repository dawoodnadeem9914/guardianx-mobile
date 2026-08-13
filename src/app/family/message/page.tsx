"use client";

import * as React from "react";
import Link from "next/link";
import { Header } from "@/components/Header";
import { VoiceAssistant } from "@/components/VoiceAssistant";
import { MessageComposer } from "@/components/MessageComposer";
import { getFamilyContacts } from "@/services/familyService";
import {
  sendViaWebShare,
  isWebShareSupported,
  buildSmsLink,
  buildSmsLinkForAll,
  buildWhatsAppLink,
} from "@/services/messagingService";
import { useSettings } from "@/lib/settingsContext";
import type { FamilyContact } from "@/types/family";
import { Keyboard, CheckCircle2, Home, MessageSquare, Share2, AlertCircle, Users } from "lucide-react";

type Step = "input" | "review" | "sending" | "shared" | "manual_fallback";

export default function FamilyMessagePage() {
  const { t } = useSettings();
  const [step, setStep] = React.useState<Step>("input");
  const [mode, setMode] = React.useState<"voice" | "text">("voice");
  const [text, setText] = React.useState("");
  const [contacts, setContacts] = React.useState<FamilyContact[]>([]);
  const [selectedIds, setSelectedIds] = React.useState<string[]>([]);
  const [selectedContacts, setSelectedContacts] = React.useState<FamilyContact[]>([]);
  const [shareError, setShareError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void getFamilyContacts().then((list) => {
      setContacts(list);
      setSelectedIds(list.map((c) => c.id));
    });
  }, []);

  function handleReady(finalText: string) {
    setText(finalText);
    setStep("review");
  }

  function toggleContact(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  /**
   * Real send attempt. Tries the real Web Share API first (opens the
   * device's actual share sheet — Messages, WhatsApp, email, whatever
   * the user has). If that isn't supported or the user backs out of
   * it, falls to a real per-contact sms:/WhatsApp link screen instead
   * of ever claiming a delivery GuardianX can't actually confirm.
   */
  async function handleSend() {
    setStep("sending");
    const selected = contacts.filter((c) => selectedIds.includes(c.id));
    setSelectedContacts(selected);

    if (isWebShareSupported()) {
      const outcome = await sendViaWebShare(text, selected);
      if (outcome.success) {
        setStep("shared");
        return;
      }
      setShareError(outcome.error ?? null);
    }

    // Real, honest fallback — genuine per-contact links the user
    // taps to actually complete the send themselves.
    setStep("manual_fallback");
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("messageFamily")} showHome />

      <div className="flex flex-1 flex-col gap-6 px-6 pb-10">
        {step === "input" && contacts.length === 0 && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4 text-center">
            <p className="text-xl font-semibold text-white">{t("noContactsYet")}</p>
            <Link href="/settings/contacts" className="text-lg font-bold text-teal underline">
              {t("addFamilyContact")}
            </Link>
          </div>
        )}

        {step === "input" && contacts.length > 0 && mode === "voice" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-6">
            <p className="text-lg text-white/80">{t("speakYourMessage")}</p>
            <VoiceAssistant onFinalTranscript={handleReady} />
            <button
              type="button"
              onClick={() => setMode("text")}
              className="flex items-center gap-2 text-lg font-semibold text-white/60 underline"
            >
              <Keyboard size={18} />
              {t("typeInstead")}
            </button>
          </div>
        )}

        {step === "input" && contacts.length > 0 && mode === "text" && (
          <div className="flex flex-1 flex-col gap-4">
            <p className="text-lg text-white/80">{t("typeYourMessage")}</p>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder="I need help. Please come home."
              className="rounded-xl2 bg-white/10 p-4 text-lg text-white placeholder:text-white/40 focus:outline-none focus:ring-2 focus:ring-teal"
            />
            <button
              type="button"
              disabled={text.trim().length === 0}
              onClick={() => handleReady(text.trim())}
              className="min-h-[4rem] rounded-xl2 bg-teal text-xl font-extrabold text-navy disabled:opacity-40"
            >
              {t("continueLabel")}
            </button>
          </div>
        )}

        {step === "review" && (
          <MessageComposer
            text={text}
            contacts={contacts}
            selectedIds={selectedIds}
            onToggleContact={toggleContact}
            onCancel={() => setStep("input")}
            onSend={() => void handleSend()}
            sending={false}
          />
        )}

        {step === "sending" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-4">
            <p className="text-xl font-semibold text-white">Opening your share options…</p>
          </div>
        )}

        {step === "shared" && (
          <div className="flex flex-1 flex-col items-center justify-center gap-5 text-center">
            <CheckCircle2 size={56} className="text-safe" />
            <p className="text-2xl font-extrabold text-white">{t("openedInYourApp")}</p>
            <p className="text-lg text-white/70">
              {t("finishSendingThere")} {selectedContacts.map((c) => c.name).join(", ")}
            </p>
            <Link
              href="/"
              className="mt-4 flex min-h-[4rem] w-full items-center justify-center gap-2 rounded-xl2 bg-teal text-xl font-extrabold text-navy"
            >
              <Home size={22} />
              {t("backToHome")}
            </Link>
          </div>
        )}

        {step === "manual_fallback" && (
          <div className="flex flex-1 flex-col gap-4">
            {shareError && (
              <div className="flex items-start gap-2 rounded-xl2 bg-white/5 p-3 text-sm text-white/60">
                <AlertCircle size={18} className="mt-0.5 shrink-0" />
                <span>Sharing isn&apos;t available right now, so send it directly below.</span>
              </div>
            )}
            <p className="text-lg font-semibold text-white">
              Tap a contact to open your real messaging app with your message pre-filled — you
              still need to tap Send inside that app to actually deliver it.
            </p>

            {selectedContacts.length > 1 && (
              <div className="rounded-xl2 border-2 border-teal/40 bg-teal/[0.08] p-4">
                <p className="flex items-center gap-2 text-base font-bold text-white">
                  <Users size={20} className="shrink-0 text-teal" />
                  Send to all {selectedContacts.length}
                </p>
                <p className="mt-1 text-sm text-white/60">
                  Opens Messages with {selectedContacts.map((c) => c.name).join(", ")} added as
                  recipients and your message pre-filled. You still need to press Send.
                  WhatsApp doesn&apos;t support sending to multiple people this way, so that&apos;s
                  only available per-contact below.
                </p>

                  <a
                    href={buildSmsLinkForAll(selectedContacts, text)}
                    className="mt-3 flex min-h-[3.75rem] items-center justify-center gap-2 rounded-xl bg-teal text-lg font-bold text-navy active:scale-[0.98]"
                  >
                  <MessageSquare size={20} />
                  SEND TO ALL (TEXT)
                </a>
              </div>
            )}

            <div className="flex flex-col gap-3">
              {selectedContacts.length > 1 && (
                <p className="text-sm font-semibold uppercase tracking-wide text-white/40">
                  Or send individually
                </p>
              )}
              {selectedContacts.map((contact) => (
                <div key={contact.id} className="rounded-xl2 bg-white/5 p-4">
                  <p className="text-lg font-bold text-white">{contact.name}</p>
                  <p className="text-sm text-white/60">{contact.phone}</p>
                  <div className="mt-3 flex gap-2">

                      <a
                        href={buildSmsLink(contact, text)}
                        className="flex flex-1 min-h-[3.5rem] items-center justify-center gap-2 rounded-xl bg-teal text-lg font-bold text-navy"
                      >
                      <MessageSquare size={20} />
                      Text
                    </a>

                      <a
                        href={buildWhatsAppLink(contact, text)}
                        target="_blank"
                        rel="noreferrer"
                        className="flex flex-1 min-h-[3.5rem] items-center justify-center gap-2 rounded-xl bg-safe text-lg font-bold text-white"
                      >
                      <Share2 size={20} />
                      WhatsApp
                    </a>
                  </div>
                </div>
              ))}
            </div>
            <Link
              href="/"
              className="mt-2 flex min-h-[4rem] w-full items-center justify-center gap-2 rounded-xl2 border-2 border-white/20 text-xl font-bold text-white"
            >
              <Home size={22} />
              {t("backToHome")}
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}