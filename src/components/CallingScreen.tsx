"use client";

import { PhoneCall } from "lucide-react";
import { useSettings } from "@/lib/settingsContext";

/**
 * The app's own transition/calling UI, shown before/around handing
 * off to the device's real phone system. A web app cannot fully
 * control the native call screen — this never claims otherwise.
 */
export function CallingScreen({
  name,
  number,
  simulated,
}: {
  name: string;
  number: string;
  simulated: boolean;
}) {
  const { t } = useSettings();

  return (
    <div className="flex flex-col items-center gap-6 py-10 text-center">
      <span className="flex h-24 w-24 items-center justify-center rounded-full bg-safe/20">
        <PhoneCall size={44} className="animate-pulse text-safe" />
      </span>
      <div>
        <p className="text-lg text-white/70">{t("calling")}</p>
        <h2 className="mt-1 text-3xl font-extrabold text-white">{name}</h2>
        <p className="mt-1 text-xl text-white/80">{number}</p>
      </div>
      {simulated && (
        <span className="rounded-full bg-teal/20 px-4 py-1.5 text-sm font-bold uppercase tracking-wide text-teal-soft">
          Simulation — no real call is being made
        </span>
      )}
    </div>
  );
}
