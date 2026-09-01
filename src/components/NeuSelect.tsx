"use client";

import { SelectHTMLAttributes, forwardRef } from "react";

interface NeuSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label: string;
}

export const NeuSelect = forwardRef<HTMLSelectElement, NeuSelectProps>(
  ({ label, id, className = "", children, ...props }, ref) => {
    const selectId = id ?? label.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className="flex flex-col gap-2">
        <label htmlFor={selectId} className="eyebrow !gap-2 text-(--color-text-secondary) normal-case tracking-normal">
          {label}
        </label>
        <select
          ref={ref}
          id={selectId}
          className={`neu-inset focus-ring w-full py-3 pl-4 pr-11 text-(--color-text-primary) bg-transparent outline-none ${className}`}
          {...props}
        >
          {children}
        </select>
      </div>
    );
  }
);
NeuSelect.displayName = "NeuSelect";