"use client";

import { Header } from "@/components/Header";
import { LargeActionButton } from "@/components/LargeActionButton";
import { useSettings } from "@/lib/settingsContext";

export default function SettingsPage() {
  const { t } = useSettings();

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("settings")} showHome />

      <div className="flex flex-1 flex-col gap-4 px-6 pb-10">
        <LargeActionButton
          icon={<span className="text-2xl">👤</span>}
          title={t("myInformation")}
          subtitle={t("myInformationDesc")}
          accent="neutral"
          size="large"
          href="/settings/profile"
        />

        <LargeActionButton
          icon={<span className="text-2xl">👨‍👩‍👧</span>}
          title={t("familyContacts")}
          subtitle={`${t("familyContactsDesc")} — ${t("maxContacts")}`}
          accent="neutral"
          size="large"
          href="/settings/contacts"
        />

        <LargeActionButton
          icon={<span className="text-2xl">🏥</span>}
          title={t("medicalInformation")}
          subtitle={t("medicalInformationDesc")}
          accent="neutral"
          size="large"
          href="/settings/medical"
        />

        <LargeActionButton
          icon={<span className="text-2xl">📍</span>}
          title={t("location")}
          subtitle={t("locationDesc")}
          accent="neutral"
          size="large"
          href="/settings/location"
        />

        <LargeActionButton
          icon={<span className="text-2xl">🔔</span>}
          title={t("notifications")}
          subtitle={t("notificationsDesc")}
          accent="neutral"
          size="large"
          href="/settings/notifications"
        />

        <LargeActionButton
          icon={<span className="text-2xl">♿</span>}
          title={t("accessibility")}
          subtitle={t("accessibilityDesc")}
          accent="neutral"
          size="large"
          href="/settings/accessibility"
        />

        <LargeActionButton
          icon={<span className="text-2xl">🔗</span>}
          title={t("connectToGuardianX")}
          subtitle={t("connectDesc")}
          accent="teal"
          size="large"
          href="/connect"
        />

        <LargeActionButton
          icon={<span className="text-2xl">🎓</span>}
          title={t("simulationMode")}
          subtitle={t("simulationModeDesc")}
          accent="safe"
          size="large"
          href="/emergency/simulation?type=medical&demo=true"
        />
      </div>
    </div>
  );
}