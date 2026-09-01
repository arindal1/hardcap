"use client";

import { useEffect } from "react";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="flex min-h-dvh items-center justify-center px-4 sm:px-6">
      <div className="neu-raised max-w-md px-6 py-10 text-center sm:px-10 sm:py-12">
        <h1 className="font-(family-name:--font-display) text-3xl italic text-(--color-accent-strong)">
          Something went wrong
        </h1>
        <p className="mt-2 text-sm text-(--color-text-secondary)">
          An unexpected error occurred. You can try again, or head back to the dashboard.
        </p>
        <button
          onClick={reset}
          className="neu-raised neu-pressable focus-ring mt-8 px-6 py-3 font-medium text-(--color-text-primary)"
        >
          Try again
        </button>
      </div>
    </div>
  );
}