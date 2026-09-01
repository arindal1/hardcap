"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { motion } from "framer-motion";

const links = [
  { href: "/dashboard", label: "Dashboard", glyph: "01" },
  { href: "/groups", label: "Groups", glyph: "02" },
  { href: "/expenses", label: "Expenses", glyph: "03" },
  { href: "/lending", label: "Lending", glyph: "04" },
  { href: "/insight", label: "Insight", glyph: "05" },
];

/** Desktop: floating pill nav with a sliding active indicator. Mobile: fixed bottom tab bar (see BottomNav). */
export function NavBar() {
  const pathname = usePathname();

  return (
    <>
      <nav className="fixed inset-x-0 top-0 z-40 hidden justify-center px-6 pt-6 md:flex">
        <div className="neu-raised flex items-center gap-1 px-2 py-2">
          <Link
            href="/dashboard"
            className="focus-ring mr-2 px-3 font-(family-name:--font-display) text-lg italic text-(--color-accent-strong)"
          >
            HardCap
          </Link>
          {links.map((link) => {
            const active = pathname === link.href;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="focus-ring relative px-4 py-2 text-sm"
                data-cursor="link"
              >
                {active && (
                  <motion.span
                    layoutId="nav-pill"
                    className="neu-inset absolute inset-0"
                    transition={{ type: "spring", stiffness: 380, damping: 32 }}
                  />
                )}
                <span
                  className={`relative z-10 ${
                    active ? "text-(--color-accent-strong)" : "text-(--color-text-secondary) hover:text-(--color-text-primary)"
                  }`}
                >
                  {link.label}
                </span>
              </Link>
            );
          })}
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="focus-ring ml-2 px-4 py-2 text-sm text-(--color-text-muted) hover:text-(--color-danger)"
          >
            Log out
          </button>
        </div>
      </nav>
      <BottomNav pathname={pathname} />
    </>
  );
}

function BottomNav({ pathname }: { pathname: string }) {
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 flex justify-center px-2 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-3 md:hidden">
      <div className="neu-raised flex w-full max-w-md items-center justify-between gap-0.5 px-1 py-2 sm:gap-1 sm:px-2">
        {links.map((link) => {
          const active = pathname === link.href;
          return (
            <Link
              key={link.href}
              href={link.href}
              className="focus-ring relative flex min-w-0 flex-1 flex-col items-center gap-1 px-0.5 py-2"
              aria-current={active ? "page" : undefined}
            >
              {active && (
                <motion.span
                  layoutId="nav-pill-mobile"
                  className="neu-inset absolute inset-0"
                  transition={{ type: "spring", stiffness: 380, damping: 32 }}
                />
              )}
              <span
                className={`font-(family-name:--font-mono) relative z-10 text-[9px] tracking-[0.15em] sm:text-[10px] sm:tracking-[0.2em] ${
                  active ? "text-(--color-accent-strong)" : "text-(--color-text-muted)"
                }`}
              >
                {link.glyph}
              </span>
              <span
                className={`relative z-10 w-full truncate text-center text-[10px] sm:text-[11px] ${
                  active ? "text-(--color-accent-strong)" : "text-(--color-text-secondary)"
                }`}
              >
                {link.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}