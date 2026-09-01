"use client";

import { InputHTMLAttributes, forwardRef } from "react";

interface NeuInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
}

export const NeuInput = forwardRef<HTMLInputElement, NeuInputProps>(
  ({ label, error, id, ...props }, ref) => {
    const inputId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={inputId} className="text-sm text-(--color-text-secondary)">
          {label}
        </label>
        <input
          ref={ref}
          id={inputId}
          className="neu-inset focus-ring w-full px-4 py-3 text-(--color-text-primary) bg-transparent outline-none placeholder:text-(--color-text-muted)"
          {...props}
        />
        {error && <span className="text-sm text-(--color-danger)">{error}</span>}
      </div>
    );
  }
);
NeuInput.displayName = "NeuInput";