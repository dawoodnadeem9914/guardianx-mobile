"use client";

import { useRouter } from "next/navigation";
import { ChevronLeft, Home } from "lucide-react";

type HeaderProps = {
  title: string;
  showHome?: boolean;
  onBack?: () => void;
};

export function Header({
  title,
  showHome = false,
  onBack,
}: HeaderProps) {
  const router = useRouter();

  function handleBack() {
    if (onBack) {
      onBack();
    } else {
      router.back();
    }
  }

  return (
    <div className="flex items-center justify-between px-4 py-4">
      {/* Back button */}
      <button
        type="button"
        onClick={handleBack}
        aria-label="Go back"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
      >
        <ChevronLeft size={30} />
      </button>

      {/* Page title */}
      <h1 className="text-xl font-bold text-white">
        {title}
      </h1>

      {/* Home button */}
      {showHome ? (
        <button
          type="button"
          onClick={() => router.push("/")}
          aria-label="Go home"
          className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-white active:bg-white/20"
        >
          <Home size={26} />
        </button>
      ) : (
        <span className="w-14" />
      )}
    </div>
  );
}