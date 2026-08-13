"use client";

import Link from "next/link";
import { Header } from "@/components/Header";
import { useSettings } from "@/lib/settingsContext";

export default function FamilyPage() {
  const { t } = useSettings();

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("familyAndRelatives")} showHome />

      <div className="flex flex-1 flex-col justify-center gap-6 px-6 pb-10">

        {/* MESSAGE FAMILY */}
        <Link
          href="/family/message"
          className="flex min-h-[12rem] flex-col items-center justify-center rounded-[2rem] border-[3px] border-teal bg-[#0d2630] px-6 text-center active:scale-[0.98]"
        >
          <div className="mb-4 text-6xl">
            💬
          </div>

          <span className="text-[1.7rem] font-extrabold text-teal">
            {t("messageFamily")}
          </span>
        </Link>

        {/* CALL FAMILY */}
        <Link
          href="/family/call"
          className="flex min-h-[12rem] flex-col items-center justify-center rounded-[2rem] border-[3px] border-teal bg-[#0d2630] px-6 text-center active:scale-[0.98]"
        >
          <div className="mb-4 text-6xl">
            📞
          </div>

          <span className="text-[1.7rem] font-extrabold text-teal">
            {t("callFamily")}
          </span>
        </Link>

      </div>
    </div>
  );
}