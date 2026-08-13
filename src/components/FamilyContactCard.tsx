"use client";

import type { FamilyContact } from "@/types/family";
import { Phone, Trash2, Check, Pencil } from "lucide-react";

export function FamilyContactCard({
  contact,
  onCall,
  onEdit,
  onRemove,
  selectable,
  selected,
  onToggleSelect,
}: {
  contact: FamilyContact;
  onCall?: () => void;
  /** When provided, shows a large, clearly-labeled Edit button below the contact info — see settings/contacts/page.tsx. */
  onEdit?: () => void;
  onRemove?: () => void;
  selectable?: boolean;
  selected?: boolean;
  onToggleSelect?: () => void;
}) {
  return (
    <div className="rounded-xl2 bg-white/5 p-4 shadow-lg">
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={selectable ? onToggleSelect : undefined}
          className="flex flex-1 items-center gap-3 text-left"
          disabled={!selectable}
        >
          {selectable && (
            <span
              className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md border-2 ${
                selected ? "border-teal bg-teal" : "border-white/30"
              }`}
            >
              {selected && <Check size={16} className="text-navy" strokeWidth={3} />}
            </span>
          )}
          <div>
            <p className="text-lg font-bold text-white">{contact.name}</p>
            <p className="text-sm text-white/60">
              {contact.relationship} · {contact.phone}
            </p>
          </div>
        </button>

        {onCall && (
          <button
            type="button"
            onClick={onCall}
            aria-label={`Call ${contact.name}`}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-safe text-white active:scale-95"
          >
            <Phone size={20} />
          </button>
        )}
      </div>

      {(onEdit || onRemove) && (
        <div className="mt-3 flex gap-2">
          {onEdit && (
            <button
              type="button"
              onClick={onEdit}
              className="flex min-h-[3rem] flex-1 items-center justify-center gap-2 rounded-xl bg-teal/20 text-base font-bold text-teal active:scale-[0.98]"
            >
              <Pencil size={18} />
              Edit
            </button>
          )}
          {onRemove && (
            <button
              type="button"
              onClick={onRemove}
              aria-label={`Remove ${contact.name}`}
              className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-white/10 text-white/70 active:scale-95"
            >
              <Trash2 size={18} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}