"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

type Accent = "emergency" | "safe" | "teal" | "neutral";

const ACCENT_STYLES: Record<Accent, string> = {
  emergency: "bg-emergency hover:bg-emergency-strong text-white",
  safe: "bg-safe hover:bg-safe-strong text-white",
  teal: "bg-teal hover:bg-teal-strong text-navy",
  neutral: "bg-white/10 hover:bg-white/15 text-white border border-white/15",
};

/** Icon badge background per accent — gives the icon real visual weight instead of floating bare against the card, matching the GuardianX website's own icon-badge pattern. */
const ICON_BADGE_STYLES: Record<Accent, string> = {
  emergency: "bg-white/20 text-white",
  safe: "bg-white/20 text-white",
  teal: "bg-navy/15 text-navy",
  neutral: "bg-teal/20 text-teal",
};

interface Props {
  icon: ReactNode;
  title: string;
  subtitle?: string;
  accent?: Accent;
  href?: string;
  onClick?: () => void;
  disabled?: boolean;
  size?: "huge" | "large" | "medium";
}

/**
 * The core touch target of GuardianX Mobile — every primary action in
 * the app is one of these. Deliberately large (min 88px tall for
 * "huge"), high-contrast, icon + text together (never icon alone), so
 * it stays understandable and reachable for elderly users, children,
 * and anyone under stress.
 */
export function LargeActionButton({
  icon,
  title,
  subtitle,
  accent = "neutral",
  href,
  onClick,
  disabled,
  size = "huge",
}: Props) {
  const sizeClasses =
    size === "huge"
      ? "min-h-[6.5rem] px-6 py-5 text-2xl"
      : size === "large"
        ? "min-h-[5.5rem] px-5 py-4 text-xl"
        : "min-h-[3.75rem] px-4 py-3 text-base";

  const badgeSize = size === "medium" ? "h-10 w-10" : "h-12 w-12";

  const content = (
    <>
      <span
        className={cn(
          "flex shrink-0 items-center justify-center rounded-full",
          badgeSize,
          ICON_BADGE_STYLES[accent]
        )}
      >
        {icon}
      </span>
      <span className="flex flex-col items-start text-left">
        <span className="font-extrabold leading-tight">{title}</span>
        {subtitle && <span className="text-sm font-medium opacity-80">{subtitle}</span>}
      </span>
    </>
  );

  const classes = cn(
    "flex w-full items-center gap-4 rounded-xl2 shadow-lg transition-transform active:scale-[0.98]",
    sizeClasses,
    ACCENT_STYLES[accent],
    disabled && "pointer-events-none opacity-50"
  );

  if (href && !disabled) {
    return (
      <Link href={href} className={classes}>
        {content}
      </Link>
    );
  }

  return (
    <button type="button" onClick={onClick} disabled={disabled} className={classes}>
      {content}
    </button>
  );
}
