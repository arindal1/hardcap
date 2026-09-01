"use client";

import { useEffect, useRef } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

/**
 * Scroll-scrubbed reveal for below-the-fold sections — fades/lifts children
 * (optionally staggering direct children) as they enter the viewport.
 * Skips entirely under prefers-reduced-motion.
 */
export function ScrollReveal({
  children,
  stagger = false,
  className,
}: {
  children: React.ReactNode;
  stagger?: boolean;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    if (!ref.current) return;
    const targets = stagger ? Array.from(ref.current.children) : ref.current;
    const ctx = gsap.context(() => {
      gsap.fromTo(
        targets,
        { opacity: 0, y: 28 },
        {
          opacity: 1,
          y: 0,
          duration: 0.8,
          ease: "power3.out",
          stagger: stagger ? 0.08 : 0,
          scrollTrigger: { trigger: ref.current, start: "top 85%", once: true },
        }
      );
    }, ref);
    return () => ctx.revert();
  }, [stagger]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}