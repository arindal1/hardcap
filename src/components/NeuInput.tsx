"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface NeuInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const NeuInput = forwardRef<HTMLInputElement, NeuInputProps>(
  ({ label, error, id, className = "", ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="eyebrow !gap-2 text-(--color-text-secondary) normal-case tracking-normal">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className={`neu-inset focus-ring w-full px-4 py-3 text-(--color-text-primary) bg-transparent outline-none placeholder:text-(--color-text-muted) transition-shadow duration-200 focus:shadow-[inset_4px_4px_10px_var(--shadow-dark),inset_-3px_-3px_8px_var(--shadow-light),0_0_0_3px_rgba(var(--color-accent-rgb),0.18)] ${className}`}
          {...props}
        />
        {error && <span className="text-sm text-(--color-danger)">{error}</span>}
      </div>
    );
  }
);
NeuInput.displayName = "NeuInput";