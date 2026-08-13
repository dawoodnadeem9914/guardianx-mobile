"use client";

import * as React from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { getFamilyContacts } from "@/services/familyService";
import { buildCallAction } from "@/services/callingService";
import { useSettings } from "@/lib/settingsContext";
import type { FamilyContact } from "@/types/family";
import { Volume2, Mic, Grid3x3, PhoneOff, CheckCircle2, Home } from "lucide-react";

function FamilyCallingContent() {
  const params = useParams<{ contactId: string }>();
  const searchParams = useSearchParams();
  const router = useRouter();
  const { t } = useSettings();
  const demo = searchParams.get("demo") === "true";

  const [contact, setContact] = React.useState<FamilyContact | null>(null);
  const [ended, setEnded] = React.useState(false);
  const [speaker, setSpeaker] = React.useState(false);
  const [mute, setMute] = React.useState(false);
  const dialedRef = React.useRef(false);

  React.useEffect(() => {
    void getFamilyContacts().then((list) => {
      const found = list.find((c) => c.id === params.contactId) ?? null;
      setContact(found);
      if (found && !dialedRef.current) {
        dialedRef.current = true;
        const action = buildCallAction(found.phone, demo);
        if (action.href) window.location.href = action.href;
      }
    });
  }, [params.contactId, demo]);

  if (!contact) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-4 px-6 text-center">
        <p className="text-xl font-semibold text-white">Contact not found.</p>
        <button onClick={() => router.push("/family/call")} className="text-lg font-bold text-teal underline">
          Back to contacts
        </button>
      </div>
    );
  }

  if (ended) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center gap-5 px-6 text-center">
        <CheckCircle2 size={56} className="text-safe" />
        <p className="text-2xl font-extrabold text-white">{t("callEnded")}</p>
        <p className="text-lg text-white/70">Your call with {contact.name} has ended.</p>
        <Link
          href="/"
          className="mt-4 flex min-h-[4rem] w-full items-center justify-center gap-2 rounded-xl2 bg-teal text-xl font-extrabold text-navy"
        >
          <Home size={22} />
          {t("backToHome")}
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-between px-6 py-10">
      <div />
      <div className="flex flex-col items-center gap-3 text-center">
        {demo && (
          <span className="rounded-full bg-teal/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-teal-soft">
            Simulation — no real call is being made
          </span>
        )}
        <p className="text-lg text-white/70">{t("calling")}</p>
        <span className="flex h-28 w-28 items-center justify-center rounded-full bg-white/10 text-4xl">
          {contact.name.charAt(0)}
        </span>
        <h1 className="text-3xl font-extrabold text-white">{contact.name}</h1>
        <p className="text-xl text-white/80">{contact.phone}</p>
      </div>

      <div className="flex w-full flex-col items-center gap-8">
        <div className="flex gap-6">
          <button
            type="button"
            onClick={() => setSpeaker((v) => !v)}
            className={`flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-full text-xs font-semibold ${speaker ? "bg-teal text-navy" : "bg-white/10 text-white"}`}
          >
            <Volume2 size={22} />
            Speaker
          </button>
          <button
            type="button"
            onClick={() => setMute((v) => !v)}
            className={`flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-full text-xs font-semibold ${mute ? "bg-teal text-navy" : "bg-white/10 text-white"}`}
          >
            <Mic size={22} />
            Mute
          </button>
          <button
            type="button"
            className="flex h-16 w-16 flex-col items-center justify-center gap-1 rounded-full bg-white/10 text-xs font-semibold text-white"
          >
            <Grid3x3 size={22} />
            Keypad
          </button>
        </div>

        <button
          type="button"
          onClick={() => setEnded(true)}
          aria-label="End call"
          className="flex h-20 w-20 items-center justify-center rounded-full bg-emergency shadow-xl active:scale-95"
        >
          <PhoneOff size={30} className="text-white" />
        </button>
      </div>
    </div>
  );
}

export default function FamilyCallingPage() {
  return (
    <React.Suspense
      fallback={
        <div className="flex flex-1 items-center justify-center px-6">
          <p className="text-lg text-white/60">Loading…</p>
        </div>
      }
    >
      <FamilyCallingContent />
    </React.Suspense>
  );
}
