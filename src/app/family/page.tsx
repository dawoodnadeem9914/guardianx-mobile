"use client";

import { Header } from "@/components/Header";
import { LargeActionButton } from "@/components/LargeActionButton";
import { useSettings } from "@/lib/settingsContext";
import { MessageCircle, Phone } from "lucide-react";

export default function FamilyPage() {
  const { t } = useSettings();

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("familyAndRelatives")} showHome />
      <div className="flex flex-1 flex-col justify-center gap-6 px-6 pb-10">
        <LargeActionButton icon={<MessageCircle size={40} />} title={t("messageFamily")} accent="teal" href="/family/message" />
        <LargeActionButton icon={<Phone size={40} />} title={t("callFamily")} accent="safe" href="/family/call" />
      </div>
    </div>
  );
}
