"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";

/** Fades and lifts children into view once on mount. Skips animation entirely for reduced-motion users. */
export function RevealOnMount({
  children,
  delay = 0,
}: {
  children: React.ReactNode;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!ref.current) return;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        ref.current,
        { opacity: 0, y: 16 },
        { opacity: 1, y: 0, duration: 0.6, delay, ease: "power2.out" }
      );
    }, ref);
    return () => ctx.revert();
  }, [delay]);

  return <div ref={ref}>{children}</div>;
}