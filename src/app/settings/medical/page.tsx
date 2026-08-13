"use client";

import * as React from "react";
import { Header } from "@/components/Header";
import { getMedicalInfo, saveMedicalInfo } from "@/services/settingsService";
import { useSettings } from "@/lib/settingsContext";
import type { MedicalInfo } from "@/types/user";
import { Loader2 } from "lucide-react";

const EMPTY: MedicalInfo = {
  name: "",
  age: "",
  bloodType: "",
  allergies: "",
  conditions: "",
  otherInfo: "",
};

const BLOOD_TYPES = ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"];

export default function MedicalInfoPage() {
  const { t } = useSettings();
  const [info, setInfo] = React.useState<MedicalInfo>(EMPTY);
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [saved, setSaved] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void getMedicalInfo().then((real) => {
      setInfo(real);
      setLoading(false);
    });
  }, []);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    const result = await saveMedicalInfo(info);
    setSaving(false);

    if (!result.success) {
      setError(result.error ?? "Couldn't save your medical information.");
      return;
    }
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) {
    return (
      <div className="flex flex-1 flex-col">
        <Header title={t("medicalInformation")} showHome />
        <div className="flex flex-1 items-center justify-center">
          <Loader2 size={32} className="animate-spin text-teal" />
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col">
      <Header title={t("medicalInformation")} showHome />
      <form onSubmit={handleSave} className="flex flex-1 flex-col gap-4 px-6 pb-10">
        <p className="text-white/60">
          {t("medicalVisibleNote")}
        </p>

        <label className="flex flex-col gap-1.5">
          <span className="text-lg font-semibold text-white">{t("fieldName")}</span>
          <input
            value={info.name}
            onChange={(e) => setInfo((p) => ({ ...p, name: e.target.value }))}
            placeholder="Your name"
            className="rounded-xl bg-white/10 p-4 text-lg text-white placeholder:text-white/40"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-lg font-semibold text-white">{t("fieldAge")}</span>
          <input
            value={info.age}
            onChange={(e) => setInfo((p) => ({ ...p, age: e.target.value }))}
            placeholder="Age"
            inputMode="numeric"
            className="rounded-xl bg-white/10 p-4 text-lg text-white placeholder:text-white/40"
          />
        </label>

        <div className="flex flex-col gap-1.5">
          <span className="text-lg font-semibold text-white">{t("fieldBloodType")}</span>
          <div className="grid grid-cols-4 gap-2">
            {BLOOD_TYPES.map((bt) => (
              <button
                key={bt}
                type="button"
                onClick={() => setInfo((p) => ({ ...p, bloodType: p.bloodType === bt ? "" : bt }))}
                className={`min-h-[3rem] rounded-xl text-lg font-bold ${info.bloodType === bt ? "bg-teal text-navy" : "bg-white/10 text-white"}`}
              >
                {bt}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1.5">
          <span className="text-lg font-semibold text-white">{t("fieldAllergies")}</span>
          <textarea
            value={info.allergies}
            onChange={(e) => setInfo((p) => ({ ...p, allergies: e.target.value }))}
            rows={3}
            placeholder="e.g. Penicillin"
            className="rounded-xl bg-white/10 p-4 text-lg text-white placeholder:text-white/40"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-lg font-semibold text-white">{t("fieldConditions")}</span>
          <textarea
            value={info.conditions}
            onChange={(e) => setInfo((p) => ({ ...p, conditions: e.target.value }))}
            rows={3}
            placeholder="e.g. Diabetes, asthma"
            className="rounded-xl bg-white/10 p-4 text-lg text-white placeholder:text-white/40"
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-lg font-semibold text-white">{t("fieldOtherInfo")}</span>
          <textarea
            value={info.otherInfo}
            onChange={(e) => setInfo((p) => ({ ...p, otherInfo: e.target.value }))}
            rows={3}
            placeholder="Anything else emergency responders should know"
            className="rounded-xl bg-white/10 p-4 text-lg text-white placeholder:text-white/40"
          />
        </label>

        {error && <p className="text-center text-lg font-semibold text-emergency-strong">{error}</p>}

        <button
          type="submit"
          disabled={saving}
          className="mt-2 min-h-[4rem] rounded-xl2 bg-teal text-xl font-extrabold text-navy disabled:opacity-60"
        >
          {saving ? "Saving…" : saved ? `${t("saved")} ✓` : t("save")}
        </button>
      </form>
    </div>
  );
}
