"use client";

import * as React from "react";
import { Header } from "@/components/Header";
import {
  getNotificationPermission,
  requestNotificationPermission,
  showTestNotification,
  isNotificationSupported,
} from "@/services/notificationService";
import type { NotificationPermissionState } from "@/services/notificationService";
import { useSettings } from "@/lib/settingsContext";
import type { TranslationKey } from "@/lib/i18n";
import { Bell, CheckCircle2, XCircle, HelpCircle } from "lucide-react";

const STATE_COPY_KEYS: Record<NotificationPermissionState, { labelKey: TranslationKey; descKey: TranslationKey }> = {
  granted: { labelKey: "notifOnTitle", descKey: "notifOnDesc" },
  denied: { labelKey: "notifOffTitle", descKey: "notifOffDesc" },
  default: { labelKey: "notifDefaultTitle", descKey: "notifDefaultDesc" },
  unsupported: { labelKey: "notifUnsupportedTitle", descKey: "notifUnsupportedDesc" },
};

export default function NotificationsSettingsPage() {
  const { t } = useSettings();
  const [state, setState] = React.useState<NotificationPermissionState>("default");
  const [requesting, setRequesting] = React.useState(false);
  // Starts true (optimistic — matches server render, avoiding a
  // hydration mismatch) and is corrected in the same client-only
  // effect below. Calling isNotificationSupported() directly during
  // render (the previous code) reads `window`, which doesn't exist
  // during SSR — the server renders one tree, the client's first
  // render (before this effect runs) computes a different one. That
  // was a genuine bug, not a browser-extension artifact.
  const [supported, setSupported] = React.useState(true);

  React.useEffect(() => {
    setState(getNotificationPermission());
    setSupported(isNotificationSupported());
  }, []);

  async function handleEnable() {
    setRequesting(true);
    const result = await requestNotificationPermission();
    setState(result);
    setRequesting(false);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("notifications")} showHome />
      <div className="flex flex-1 flex-col gap-6 px-6 pb-10">
        <div className="flex flex-col items-center gap-4 rounded-xl2 bg-white/5 p-6 text-center">
          {state === "granted" && <CheckCircle2 size={48} className="text-safe" />}
          {state === "denied" && <XCircle size={48} className="text-emergency" />}
          {(state === "default" || state === "unsupported") && (
            <HelpCircle size={48} className="text-white/50" />
          )}
          <p className="text-xl font-bold text-white">{t(STATE_COPY_KEYS[state].labelKey)}</p>
          <p className="text-white/70">{t(STATE_COPY_KEYS[state].descKey)}</p>
        </div>

        {supported && state !== "granted" && (
          <button
            type="button"
            onClick={() => void handleEnable()}
            disabled={requesting || state === "denied"}
            className="flex min-h-[4rem] items-center justify-center gap-2 rounded-xl2 bg-teal text-xl font-extrabold text-navy disabled:opacity-60"
          >
            <Bell size={22} />
            {requesting ? t("requesting") : t("enableNotifications")}
          </button>
        )}

        {state === "granted" && (
          <button
            type="button"
            onClick={() => showTestNotification()}
            className="flex min-h-[4rem] items-center justify-center gap-2 rounded-xl2 bg-white/10 text-xl font-bold text-white"
          >
            <Bell size={22} />
            {t("sendTestNotification")}
          </button>
        )}

        <p className="text-center text-sm text-white/40">{t("notifPushNote")}</p>
      </div>
    </div>
  );
}