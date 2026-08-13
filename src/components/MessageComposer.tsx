"use client";

import type { FamilyContact } from "@/types/family";
import { FamilyContactCard } from "@/components/FamilyContactCard";
import { MAX_FAMILY_CONTACTS } from "@/types/family";
import { useSettings } from "@/lib/settingsContext";
import { XCircle, CheckCircle2 } from "lucide-react";

export function MessageComposer({
  text,
  contacts,
  selectedIds,
  onToggleContact,
  onCancel,
  onSend,
  sending,
}: {
  text: string;
  contacts: FamilyContact[];
  selectedIds: string[];
  onToggleContact: (id: string) => void;
  onCancel: () => void;
  onSend: () => void;
  sending: boolean;
}) {
  const { t } = useSettings();

  return (
    <div className="flex flex-col gap-5">
      <div className="rounded-xl2 bg-white/10 p-4">
        <p className="text-sm font-semibold uppercase tracking-wide text-white/60">
          {t("reviewMessage")}
        </p>
        <p className="mt-1 text-xl text-white">{text}</p>
      </div>

      <div>
        <p className="mb-2 text-sm font-semibold uppercase tracking-wide text-white/60">
          {t("sendTo")}
        </p>
        <div className="flex flex-col gap-2">
          {contacts.map((c) => (
            <FamilyContactCard
              key={c.id}
              contact={c}
              selectable
              selected={selectedIds.includes(c.id)}
              onToggleSelect={() => onToggleContact(c.id)}
            />
          ))}
        </div>
      </div>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={onCancel}
          className="flex min-h-[4rem] flex-1 items-center justify-center gap-2 rounded-xl2 border-2 border-white/20 text-xl font-bold text-white active:scale-[0.98]"
        >
          <XCircle size={22} />
          {t("cancel")}
        </button>
        <button
          type="button"
          onClick={onSend}
          disabled={sending || selectedIds.length === 0}
          className="flex min-h-[4rem] flex-1 items-center justify-center gap-2 rounded-xl2 bg-safe text-xl font-bold text-white active:scale-[0.98] disabled:opacity-50"
        >
          {sending ? (
            "Sending…"
          ) : (
            <>
              <CheckCircle2 size={22} />
              {t("sendMessage")}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
