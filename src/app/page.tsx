"use client";

import * as React from "react";
import Link from "next/link";
import { useSettings } from "@/lib/settingsContext";
import { Settings as SettingsIcon, Link2, CheckCircle2, XCircle } from "lucide-react";
import { getConnectionStatus } from "@/services/connectionService";

export default function HomePage() {
  const { t } = useSettings();

  // Real Supabase session state — never a fake localStorage boolean. This
  // is the SAME getConnectionStatus() the /connect page already uses,
  // which asks Supabase for the real current session rather than trusting
  // any locally-stored flag. Re-checked every time the home screen mounts,
  // so coming back from /connect after connecting or disconnecting always
  // reflects the actual current state.
  const [websiteConnected, setWebsiteConnected] = React.useState(false);

  React.useEffect(() => {
    let cancelled = false;
    void getConnectionStatus().then((status) => {
      if (!cancelled) setWebsiteConnected(status.connected);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2.5">
          <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-teal text-lg font-extrabold text-navy">
            G
          </span>

          <span className="text-xl font-extrabold tracking-tight text-white">
            Guardian<span className="text-teal">X</span>
          </span>
        </div>

        {/* Small top button — Website Connection status. Replaces the old
            icon-only Settings shortcut. Taps through to the existing
            /connect page (same connectionService.ts flow — no new
            connection/authentication system). The big Settings button
            below, and the full /settings page, are unchanged. */}
        <Link
          href="/connect"
          aria-label={t("websiteConnectionTitle")}
          className={`flex h-9 items-center gap-1.5 rounded-full border-2 px-3 text-xs font-bold active:scale-[0.98] ${
            websiteConnected
              ? "border-teal/40 bg-teal/10 text-teal-soft"
              : "border-white/15 bg-white/10 text-white/70"
          }`}
        >
          {websiteConnected ? <CheckCircle2 size={15} /> : <XCircle size={15} />}
          {websiteConnected ? t("connectedShort") : t("notConnectedShort")}
        </Link>
      </div>

      {/* No account banner */}
      <div className="mt-6 rounded-xl2 border border-teal/30 bg-teal/10 px-4 py-3 text-center">
        <p className="text-sm font-medium text-teal-soft">
          {t("noAccountBanner")}
        </p>
      </div>

      {/* Main Emergency / Family cards */}
      <div className="flex flex-1 flex-col justify-center gap-4 py-8">

        {/* Emergency Help */}
        <Link
          href="/emergency"
          className="flex min-h-[13rem] flex-col items-center justify-center rounded-[1.8rem] border-2 border-red-400/70 bg-gradient-to-b from-red-500 to-red-700 px-6 py-6 text-center shadow-lg active:scale-[0.98]"
        >
          <span className="mb-3 text-5xl drop-shadow-md">
            🚨
          </span>

          <h2 className="text-2xl font-extrabold tracking-tight text-white">
            {t("emergencyHelp")}
          </h2>

          <p className="mt-1 text-base font-medium text-white/95">
            {t("getHelpNow")}
          </p>
        </Link>

        {/* Family & Relatives */}
        <Link
          href="/family"
          className="flex min-h-[13rem] flex-col items-center justify-center rounded-[1.8rem] border-2 border-teal-400/70 bg-gradient-to-b from-teal-500 to-teal-700 px-6 py-6 text-center shadow-lg active:scale-[0.98]"
        >
          <span className="mb-3 text-5xl drop-shadow-md">
            👨‍👩‍👧
          </span>

          <h2 className="text-2xl font-extrabold tracking-tight text-slate-950">
            {t("familyAndRelatives")}
          </h2>

          <p className="mt-1 text-base font-medium text-slate-950/90">
            {t("callOrMessage")}
          </p>
        </Link>
      </div>

      {/* Bottom buttons */}
      <div className="flex flex-col gap-3 pb-2">
        <Link
          href="/connect"
          className="flex min-h-[3.5rem] items-center justify-center gap-2 rounded-full border-2 border-white/15 text-base font-semibold text-white/80 active:scale-[0.98]"
        >
          <Link2 size={18} />
          {t("connectToGuardianX")}
        </Link>

        <Link
          href="/settings"
          className="flex min-h-[3.75rem] items-center justify-center gap-2 rounded-full border-2 border-teal/40 bg-teal/[0.08] text-base font-bold text-teal-soft active:scale-[0.98]"
        >
          <SettingsIcon size={20} />
          {t("settings")}
        </Link>
      </div>
    </div>
  );
}