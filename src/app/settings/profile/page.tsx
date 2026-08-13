"use client";

import * as React from "react";
import { Header } from "@/components/Header";
import { getUserProfile, saveUserProfile } from "@/services/settingsService";
import { useSettings } from "@/lib/settingsContext";
import type { UserProfile } from "@/types/user";

export default function MyInformationPage() {
  const { settings, t } = useSettings();
  const [profile, setProfile] = React.useState<UserProfile>({ name: "", age: "", language: "en" });
  const [saved, setSaved] = React.useState(false);

  React.useEffect(() => {
    setProfile(getUserProfile());
  }, []);

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    // Language itself is set from Settings → Accessibility (the one
    // real, app-wide language switch) — this page no longer has its
    // own separate, non-functional language control. The current
    // app language is still saved alongside name/age so it travels
    // with the rest of this profile record.
    saveUserProfile({ ...profile, language: settings.language });
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("myInformation")} showHome />
      <form onSubmit={handleSave} className="flex flex-1 flex-col gap-4 px-6 pb-10">
        <p className="text-white/60">Stored only on this device for now.</p>

        <label className="flex flex-col gap-1.5">
          <span className="text-lg font-semibold text-white">{t("fieldName")}</span>
          <input
            value={profile.name}
            onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))}
            placeholder="Your name"
            className="rounded-xl bg-white/10 p-4 text-lg text-white placeholder:text-white/40"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-lg font-semibold text-white">{t("fieldAge")}</span>
          <input
            value={profile.age}
            onChange={(e) => setProfile((p) => ({ ...p, age: e.target.value }))}
            placeholder="Age"
            inputMode="numeric"
            className="rounded-xl bg-white/10 p-4 text-lg text-white placeholder:text-white/40"
          />
        </label>

        <button type="submit" className="mt-2 min-h-[4rem] rounded-xl2 bg-teal text-xl font-extrabold text-navy">
          {saved ? `${t("saved")} ✓` : t("save")}
        </button>
      </form>
    </div>
  );
}
