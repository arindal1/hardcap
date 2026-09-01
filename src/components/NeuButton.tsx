"use client";

import { ButtonHTMLAttributes } from "react";
import { motion } from "framer-motion";

interface NeuButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "accent" | "default";
}

export function NeuButton({ variant = "default", className = "", children, ...props }: NeuButtonProps) {
  const accent = variant === "accent";
  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      className={`neu-raised neu-pressable focus-ring px-6 py-3 font-medium ${
        accent ? "text-(--color-accent-strong)" : "text-(--color-text-primary)"
      } ${className}`}
      {...props}
    >
      {children}
    </motion.button>
  );
}