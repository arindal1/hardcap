"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";

const links = [
  { href: "/dashboard", label: "Dashboard" },
  { href: "/groups", label: "Groups" },
  { href: "/expenses", label: "Expenses" },
  { href: "/lending", label: "Lending" },
  { href: "/insight", label: "Insight" },
];

export function NavBar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  return (
    <nav className="neu-raised mx-3 mt-3 px-4 py-3 sm:mx-6 sm:mt-6 sm:px-6 sm:py-4">
      <div className="flex items-center justify-between">
        <span className="font-(family-name:--font-display) text-xl italic text-(--color-accent-strong)">
          HardCap
        </span>
        <div className="hidden items-center gap-6 text-sm md:flex">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={
                pathname === link.href
                  ? "text-(--color-accent-strong)"
                  : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
              }
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="focus-ring text-sm text-(--color-text-muted) hover:text-(--color-danger)"
          >
            Log out
          </button>
        </div>
        <button
          onClick={() => setOpen((v) => !v)}
          aria-label={open ? "Close menu" : "Open menu"}
          aria-expanded={open}
          className="focus-ring -mr-2 flex h-11 w-11 flex-col items-center justify-center gap-1.5 md:hidden"
        >
          <span
            className={`h-0.5 w-5 bg-(--color-text-secondary) transition-transform ${open ? "translate-y-2 rotate-45" : ""}`}
          />
          <span className={`h-0.5 w-5 bg-(--color-text-secondary) transition-opacity ${open ? "opacity-0" : ""}`} />
          <span
            className={`h-0.5 w-5 bg-(--color-text-secondary) transition-transform ${open ? "-translate-y-2 -rotate-45" : ""}`}
          />
        </button>
      </div>
      {open && (
        <div className="mt-4 flex flex-col gap-4 border-t border-white/5 pt-4 text-sm md:hidden">
          {links.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              onClick={() => setOpen(false)}
              className={
                pathname === link.href
                  ? "text-(--color-accent-strong)"
                  : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
              }
            >
              {link.label}
            </Link>
          ))}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="focus-ring text-left text-(--color-text-muted) hover:text-(--color-danger)"
          >
            Log out
          </button>
        </div>
      )}
    </nav>
  );
}