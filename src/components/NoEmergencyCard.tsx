"use client";

import { ShieldCheck, ArrowLeft, PhoneCall } from "lucide-react";
import { EMERGENCY_NUMBER } from "@/lib/constants";
import { useSettings } from "@/lib/settingsContext";
import { telHref } from "@/lib/utils";

/**
 * Shown when the real AI classification (or the local fallback)
 * concludes "none" — no apparent emergency. Deliberately NOT the same
 * component as ConfirmationCard: that component's whole point is
 * "GuardianX recommends calling 999, confirm or cancel" — showing
 * that copy alongside "no emergency" was the exact contradiction
 * being fixed here. This card never recommends calling; it only ever
 * offers it as a secondary, user-initiated option for the case the
 * classifier got it wrong.
 */
export function NoEmergencyCard({
  onDescribeAgain,
}: {
  onDescribeAgain: () => void;
}) {
  const { t } = useSettings();

  return (
    <div className="flex flex-col items-center gap-6 rounded-xl2 bg-white/5 p-6 text-center shadow-xl">
      <ShieldCheck size={64} className="text-teal-soft" />
      <h2 className="text-2xl font-extrabold text-white">{t("noEmergencyTitle")}</h2>
      <p className="text-lg text-white/80">{t("noEmergencyMessage")}</p>

      <div className="mt-2 flex w-full flex-col gap-3">
        <button
          type="button"
          onClick={onDescribeAgain}
          className="flex min-h-[5rem] items-center justify-center gap-2 rounded-xl2 bg-teal text-2xl font-extrabold text-navy shadow-lg active:scale-[0.98]"
        >
          <ArrowLeft size={26} />
          {t("describeAgain")}
        </button>

        <div className="mt-2 border-t border-white/10 pt-4">
          <p className="text-sm text-white/60">{t("callAnywayNote")}</p>

          <a
            href={telHref(EMERGENCY_NUMBER)}
            className="mt-3 flex min-h-[3.75rem] items-center justify-center gap-2 rounded-xl2 border-2 border-white/20 text-lg font-bold text-white active:scale-[0.98]"
          >
            <PhoneCall size={20} />
            {t("call999Anyway")}
          </a>
        </div>
      </div>
    </div>
  );
}