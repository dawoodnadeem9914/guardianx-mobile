"use client";

import Link from "next/link";
import { useSettings } from "@/lib/settingsContext";
import { Settings as SettingsIcon, Link2 } from "lucide-react";

export default function HomePage() {
  const { t } = useSettings();

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

        <Link
          href="/settings"
          aria-label={t("settings")}
          className="flex h-10 w-10 items-center justify-center rounded-full bg-white/10 text-white"
        >
          <SettingsIcon size={20} />
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