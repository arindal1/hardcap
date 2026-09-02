"use client";

import { useEffect, useRef, useState } from "react";

/**
 * Odometer-style animated number. Tweens from the previous value to the new
 * one whenever `value` changes, formatting each intermediate frame through
 * `formatter`. No-ops (snaps instantly) for prefers-reduced-motion, matching
 * the pattern used by RevealOnMount/AmbientField.
 */
export function AnimatedNumber({
  value,
  formatter,
  durationMs = 700,
  className,
}: {
  value: number;
  formatter: (n: number) => string;
  durationMs?: number;
  className?: string;
}) {
  const [display, setDisplay] = useState(value);
  const prevRef = useRef(value);
  const rafRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    const from = prevRef.current;
    const to = value;
    if (from === to) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setDisplay(to);
      prevRef.current = to;
      return;
    }

    const start = performance.now();
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(from + (to - from) * eased);
      if (progress < 1) {
        rafRef.current = requestAnimationFrame(tick);
      } else {
        prevRef.current = to;
      }
    }
    rafRef.current = requestAnimationFrame(tick);
    return () => {
      if (rafRef.current !== undefined) cancelAnimationFrame(rafRef.current);
    };
  }, [value, durationMs]);

  return <span className={className}>{formatter(display)}</span>;
}