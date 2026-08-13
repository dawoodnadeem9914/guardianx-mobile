"use client";

import * as React from "react";
import { Header } from "@/components/Header";
import { checkLocationPermission, getRealLocation } from "@/services/locationService";
import type { LocationPermissionState } from "@/services/locationService";
import { useSettings } from "@/lib/settingsContext";
import type { TranslationKey } from "@/lib/i18n";
import { MapPin, CheckCircle2, XCircle, HelpCircle, Loader2 } from "lucide-react";

const STATE_COPY_KEYS: Record<LocationPermissionState, { labelKey: TranslationKey; descKey: TranslationKey }> = {
  granted: { labelKey: "locationEnabledTitle", descKey: "locationEnabledDesc" },
  denied: { labelKey: "locationDeniedTitle", descKey: "locationDeniedDesc" },
  prompt: { labelKey: "locationPromptTitle", descKey: "locationPromptDesc" },
  unsupported: { labelKey: "locationUnsupportedTitle", descKey: "locationUnsupportedDesc" },
};

export default function LocationSettingsPage() {
  const { t } = useSettings();
  const [state, setState] = React.useState<LocationPermissionState | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [testResult, setTestResult] = React.useState<string | null>(null);

  React.useEffect(() => {
    void checkLocationPermission().then(setState);
  }, []);

  async function handleTest() {
    setTesting(true);
    setTestResult(null);
    const result = await getRealLocation();
    setTesting(false);

    if (result.success) {
      setTestResult(
        `Real location received: ${result.coords.latitude.toFixed(4)}, ${result.coords.longitude.toFixed(4)}`
      );
      setState("granted");
    } else {
      setTestResult(result.message);
      setState(result.reason === "unsupported" ? "unsupported" : "denied");
    }
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("location")} showHome />
      <div className="flex flex-1 flex-col gap-6 px-6 pb-10">
        {state && (
          <div className="flex flex-col items-center gap-4 rounded-xl2 bg-white/5 p-6 text-center">
            {state === "granted" && <CheckCircle2 size={48} className="text-safe" />}
            {state === "denied" && <XCircle size={48} className="text-emergency" />}
            {(state === "prompt" || state === "unsupported") && <HelpCircle size={48} className="text-white/50" />}
            <p className="text-xl font-bold text-white">{t(STATE_COPY_KEYS[state].labelKey)}</p>
            <p className="text-white/70">{t(STATE_COPY_KEYS[state].descKey)}</p>
          </div>
        )}

        <button
          type="button"
          onClick={() => void handleTest()}
          disabled={testing}
          className="flex min-h-[4rem] items-center justify-center gap-2 rounded-xl2 bg-teal text-xl font-extrabold text-navy disabled:opacity-60"
        >
          {testing ? (
            <>
              <Loader2 size={22} className="animate-spin" />
              {t("gettingYourLocation")}
            </>
          ) : (
            <>
              <MapPin size={22} />
              {t("testRealLocation")}
            </>
          )}
        </button>

        {testResult && <p className="text-center text-white/80">{testResult}</p>}

        <p className="text-center text-sm text-white/40">{t("locationOnlyForEmergency")}</p>
      </div>
    </div>
  );
}