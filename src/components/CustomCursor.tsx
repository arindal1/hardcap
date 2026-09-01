"use client";

import { useEffect, useState } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

const INTERACTIVE_SELECTOR = "a, button, input, select, textarea, [role='button'], [data-cursor='link']";

/**
 * Replaces the system cursor on fine-pointer (mouse/trackpad) devices with a
 * two-part gold dot + trailing ring, magnetically enlarging over interactive
 * elements. No-ops entirely on touch devices and under prefers-reduced-motion
 * (the system cursor stays hidden only where this component actually renders).
 */
export function CustomCursor() {
  const [hovering, setHovering] = useState(false);
  const [visible, setVisible] = useState(false);
  const x = useMotionValue(-100);
  const y = useMotionValue(-100);
  const ringX = useSpring(x, { stiffness: 280, damping: 28, mass: 0.6 });
  const ringY = useSpring(y, { stiffness: 280, damping: 28, mass: 0.6 });

  useEffect(() => {
    const fine = window.matchMedia("(pointer: fine)").matches;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (!fine || reduced) return;

    function handleMove(e: PointerEvent) {
      x.set(e.clientX);
      y.set(e.clientY);
      setVisible(true);
      const target = e.target as HTMLElement;
      setHovering(Boolean(target.closest(INTERACTIVE_SELECTOR)));
    }
    function handleLeave() {
      setVisible(false);
    }

    window.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerleave", handleLeave);
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerleave", handleLeave);
    };
  }, [x, y]);

  return (
    <div
      aria-hidden
      className="cursor-fx pointer-events-none fixed inset-0 z-[70]"
      style={{ opacity: visible ? 1 : 0 }}
    >
      <motion.div
        className="absolute rounded-full bg-(--color-accent-strong)"
        style={{ x, y, width: 6, height: 6, translateX: "-50%", translateY: "-50%" }}
      />
      <motion.div
        className="absolute rounded-full border border-(--color-accent)"
        animate={{ width: hovering ? 56 : 32, height: hovering ? 56 : 32, opacity: hovering ? 0.9 : 0.45 }}
        transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
        style={{ x: ringX, y: ringY, translateX: "-50%", translateY: "-50%" }}
      />
    </div>
  );
}