"use client";

import Link from "next/link";
import { signOut } from "next-auth/react";

/** Slim brand + logout bar shown only on mobile, above the bottom tab bar (which owns primary nav there). */
export function MobileTopBar() {
  return (
    <div className="sticky top-0 z-30 flex items-center justify-between px-4 py-3 md:hidden">
      <Link href="/dashboard" className="focus-ring font-(family-name:--font-display) text-lg italic text-(--color-accent-strong)">
        HardCap
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="focus-ring text-xs text-(--color-text-muted) hover:text-(--color-danger)"
      >
        Log out
      </button>
    </div>
  );
}