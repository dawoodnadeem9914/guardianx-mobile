"use client";

import { Header } from "@/components/Header";
import { LargeActionButton } from "@/components/LargeActionButton";
import { useSettings } from "@/lib/settingsContext";
import {
  User,
  Users,
  HeartPulse,
  MapPin,
  Bell,
  Volume2,
  Link2,
  GraduationCap,
} from "lucide-react";

export default function SettingsPage() {
  const { t } = useSettings();

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("settings")} showHome />
      <div className="flex flex-1 flex-col gap-4 px-6 pb-10">
        <LargeActionButton
          icon={<User size={26} />}
          title={t("myInformation")}
          subtitle={t("myInformationDesc")}
          accent="neutral"
          size="large"
          href="/settings/profile"
        />
        <LargeActionButton
          icon={<Users size={26} />}
          title={t("familyContacts")}
          subtitle={`${t("familyContactsDesc")} — ${t("maxContacts")}`}
          accent="neutral"
          size="large"
          href="/settings/contacts"
        />
        <LargeActionButton
          icon={<HeartPulse size={26} />}
          title={t("medicalInformation")}
          subtitle={t("medicalInformationDesc")}
          accent="neutral"
          size="large"
          href="/settings/medical"
        />
        <LargeActionButton
          icon={<MapPin size={26} />}
          title={t("location")}
          subtitle={t("locationDesc")}
          accent="neutral"
          size="large"
          href="/settings/location"
        />
        <LargeActionButton
          icon={<Bell size={26} />}
          title={t("notifications")}
          subtitle={t("notificationsDesc")}
          accent="neutral"
          size="large"
          href="/settings/notifications"
        />
        <LargeActionButton
          icon={<Volume2 size={26} />}
          title={t("accessibility")}
          subtitle={t("accessibilityDesc")}
          accent="neutral"
          size="large"
          href="/settings/accessibility"
        />
        <LargeActionButton
          icon={<Link2 size={26} />}
          title={t("connectToGuardianX")}
          subtitle={t("connectDesc")}
          accent="teal"
          size="large"
          href="/connect"
        />
        <LargeActionButton
          icon={<GraduationCap size={26} />}
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
