"use client";

import * as React from "react";
import { Header } from "@/components/Header";
import { QrScanner } from "@/components/QrScanner";
import {
  getConnectionStatus,
  redeemConnectionCode,
  sendSignInLink,
  disconnectFromGuardianX,
} from "@/services/connectionService";
import { isSupabaseConfigured } from "@/lib/supabase";
import { useSettings } from "@/lib/settingsContext";
import type { GuardianXConnection } from "@/types/user";
import { KeyRound, CheckCircle2, Mail, AlertCircle, Loader2, ScanLine } from "lucide-react";

type Step = "loading" | "not_configured" | "enter_code" | "check_email" | "connected";

export default function ConnectPage() {
  const { t } = useSettings();
  const [step, setStep] = React.useState<Step>("loading");
  const [connection, setConnection] = React.useState<GuardianXConnection | null>(null);
  const [code, setCode] = React.useState("");
  const [error, setError] = React.useState<string | null>(null);
  const [submitting, setSubmitting] = React.useState(false);
  const [emailSentTo, setEmailSentTo] = React.useState<string | null>(null);
  const [showScanner, setShowScanner] = React.useState(false);

  React.useEffect(() => {
    // Re-checks on every load — this is what genuinely detects a
    // real session after the user taps the real magic-link email on
    // their phone and Supabase's client redirects back here.
    void getConnectionStatus().then((status) => {
      setConnection(status);
      if (!isSupabaseConfigured()) {
        setStep("not_configured");
      } else if (status.connected) {
        setStep("connected");
      } else {
        setStep("enter_code");
      }
    });
  }, []);

  /**
   * The real redeem + sign-in flow — shared by both entry paths (the
   * manual code form and the real QR camera scanner below), since
   * both ultimately produce the same real code string to exchange
   * with Supabase.
   */
  async function redeemAndSignIn(codeValue: string) {
    setError(null);
    setSubmitting(true);

    const redeemResult = await redeemConnectionCode(codeValue);
    if (!redeemResult.success) {
      setSubmitting(false);
      setError(redeemResult.error);
      return;
    }

    const otpResult = await sendSignInLink(redeemResult.email);
    setSubmitting(false);

    if (!otpResult.success) {
      setError(otpResult.error ?? "Couldn't send the sign-in email.");
      return;
    }

    setEmailSentTo(redeemResult.email);
    setStep("check_email");
  }

  function handleManualSubmit(e: React.FormEvent) {
    e.preventDefault();
    void redeemAndSignIn(code);
  }

  function handleScanned(data: string) {
    setShowScanner(false);
    setCode(data.trim().toUpperCase());
    void redeemAndSignIn(data);
  }

  async function handleDisconnect() {
    await disconnectFromGuardianX();
    setStep("enter_code");
    setConnection({ connected: false, connectedAt: null, accountLabel: null });
  }

  if (step === "loading") {
    return (
      <div className="flex flex-1 flex-col">
        <Header title={t("connectToGuardianX")} showHome />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-teal" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("connectToGuardianX")} showHome />

      <div className="flex flex-1 flex-col items-center justify-center gap-6 px-6 pb-10 text-center">
        {step === "not_configured" && (
          <>
            <AlertCircle size={56} className="text-white/40" />
            <p className="text-xl font-bold text-white">{t("connectNotConfigured")}</p>
            <p className="text-white/60">
              NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY need to be configured for
              this deployment.
            </p>
          </>
        )}

        {step === "connected" && connection && (
          <>
            <CheckCircle2 size={64} className="text-safe" />
            <p className="text-2xl font-extrabold text-white">{t("connected")}</p>
            <p className="text-white/60">{t("connectSignedInAs")} {connection.accountLabel}</p>
            <p className="text-sm text-white/40">{t("connectionSuccessful")}</p>
            <button
              type="button"
              onClick={() => void handleDisconnect()}
              className="mt-4 min-h-[3.5rem] rounded-xl2 border-2 border-white/20 px-6 text-lg font-bold text-white"
            >
              {t("disconnect")}
            </button>
          </>
        )}

        {step === "enter_code" && (
          <>
            <KeyRound size={56} className="text-teal" />
            <p className="text-lg text-white/80">{t("connectWebsiteInstruction")}</p>

            <button
              type="button"
              onClick={() => setShowScanner(true)}
              className="flex min-h-[4rem] w-full items-center justify-center gap-2 rounded-xl2 bg-teal text-xl font-extrabold text-navy active:scale-[0.98]"
            >
              <ScanLine size={24} />
              {t("scanQrCode")}
            </button>

            <p className="text-sm font-semibold uppercase tracking-wide text-white/40">{t("or")}</p>

            <form onSubmit={handleManualSubmit} className="flex w-full flex-col gap-3">
              <input
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder={t("enterCodeManually")}
                maxLength={8}
                className="rounded-xl2 bg-white/10 p-4 text-center text-2xl font-bold tracking-widest text-white placeholder:text-sm placeholder:font-semibold placeholder:tracking-normal placeholder:text-white/30"
              />
              {error && <p className="text-base font-semibold text-emergency">{error}</p>}
              <button
                type="submit"
                disabled={submitting || code.trim().length < 4}
                className="flex min-h-[4rem] items-center justify-center gap-2 rounded-xl2 border-2 border-white/20 text-xl font-extrabold text-white disabled:opacity-50"
              >
                {submitting ? <Loader2 size={22} className="animate-spin" /> : t("connect")}
              </button>
            </form>
          </>
        )}

        {step === "check_email" && (
          <>
            <Mail size={56} className="text-teal" />
            <p className="text-xl font-bold text-white">{t("checkYourEmail")}</p>
            <p className="text-white/70">
              {t("signInLinkSentTo")} <span className="text-white">{emailSentTo}</span>. {t("openOnThisDevice")}
            </p>
          </>
        )}
      </div>

      {showScanner && <QrScanner onScan={handleScanned} onClose={() => setShowScanner(false)} />}
    </div>
  );
}
