"use client";

import { ButtonHTMLAttributes, useRef } from "react";
import { motion, useMotionValue, useSpring } from "framer-motion";

type NeuButtonProps = Omit<ButtonHTMLAttributes<HTMLButtonElement>, "onAnimationStart" | "onDrag" | "onDragStart" | "onDragEnd"> & {
  variant?: "accent" | "default" | "ghost";
};

/** Neumorphic button with a subtle magnetic pull toward the cursor on hover. */
export function NeuButton({ variant = "default", className = "", children, ...props }: NeuButtonProps) {
  const ref = useRef<HTMLButtonElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 18 });
  const springY = useSpring(y, { stiffness: 200, damping: 18 });

  function handleMouseMove(e: React.MouseEvent<HTMLButtonElement>) {
    const rect = ref.current?.getBoundingClientRect();
    if (!rect) return;
    x.set((e.clientX - rect.left - rect.width / 2) * 0.15);
    y.set((e.clientY - rect.top - rect.height / 2) * 0.25);
  }
  function handleMouseLeave() {
    x.set(0);
    y.set(0);
  }

  const styles = {
    accent: "text-(--color-accent-strong)",
    default: "text-(--color-text-primary)",
    ghost: "bg-transparent shadow-none text-(--color-text-secondary) hover:text-(--color-accent)",
  }[variant];

  return (
    <motion.button
      ref={ref}
      onMouseMove={handleMouseMove}
      onMouseLeave={handleMouseLeave}
      whileTap={{ scale: 0.96 }}
      style={variant === "ghost" ? undefined : { x: springX, y: springY }}
      className={`${variant === "ghost" ? "" : "neu-raised neu-pressable"} focus-ring px-6 py-3 font-medium ${styles} ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}