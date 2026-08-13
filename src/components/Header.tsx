"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Home } from "lucide-react";

/**
 * The only navigation chrome in the app — a big Back button and a
 * title. No sidebar, no tab bar, no dense menu — matching the
 * project's explicit "minimal navigation, one decision per screen"
 * requirement.
 */
export function Header({ title, showHome = false }: { title: string; showHome?: boolean }) {
  const router = useRouter();

  return (
    <div className="flex items-center justify-between px-4 py-4">
      <button
        type="button"
        onClick={() => router.back()}
        aria-label="Go back"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
      >
        <ChevronLeft size={30} />
      </button>
      <h1 className="text-xl font-bold text-white">{title}</h1>
      {showHome ? (
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Go home"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 active:bg-white/20"
        >
          <Home size={26} />
        </button>
      ) : (
        <span className="w-14" />
      )}
    </div>
  );
}
