"use client";

import Link from "next/link";
import { LargeActionButton } from "@/components/LargeActionButton";
import { useSettings } from "@/lib/settingsContext";
import { Siren, Users, Settings as SettingsIcon, Link2 } from "lucide-react";

/**
 * The very first screen. No account, no sign-in, no medical profile
 * required — Emergency Help must be reachable immediately. The two
 * huge primary cards dominate the screen; Connect and Settings are
 * real, working secondary actions below them — Settings is also
 * reachable this way now, not only as a small header icon.
 */
export default function HomePage() {
  const { t } = useSettings();

  return (
    <div className="flex flex-1 flex-col px-6 py-6">
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

      <div className="mt-6 rounded-xl2 border border-teal/30 bg-teal/10 px-4 py-3 text-center">
        <p className="text-sm font-medium text-teal-soft">{t("noAccountBanner")}</p>
      </div>

      <div className="flex flex-1 flex-col justify-center gap-5 py-8">
        <LargeActionButton
          icon={<Siren size={40} />}
          title={t("emergencyHelp")}
          subtitle={t("getHelpNow")}
          accent="emergency"
          href="/emergency"
          size="huge"
        />
        <LargeActionButton
          icon={<Users size={40} />}
          title={t("familyAndRelatives")}
          subtitle={t("callOrMessage")}
          accent="teal"
          href="/family"
          size="huge"
        />
      </div>

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