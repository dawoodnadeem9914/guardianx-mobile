"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function EmergencyTypeCard({
  icon: Icon,
  label,
  onClick,
  selected,
  colorClass,
}: {
  icon: LucideIcon;
  label: string;
  onClick: () => void;
  selected?: boolean;
  colorClass?: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "flex min-h-[6rem] w-full flex-col items-center justify-center gap-2 rounded-xl2 border-2 p-4 text-center shadow-lg transition-transform active:scale-95",
        selected ? "border-teal bg-teal/20" : "border-white/10 bg-white/5"
      )}
    >
      <Icon size={36} className={colorClass ?? "text-white"} />
      <span className="text-lg font-bold text-white">{label}</span>
    </button>
  );
}
