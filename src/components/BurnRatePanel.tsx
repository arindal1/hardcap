"use client";

import type { BurnRate } from "@/lib/budget";

const PACE_COPY: Record<BurnRate["pace"], { label: string; color: string }> = {
  ahead: { label: "Pacing well - spend is behind the calendar", color: "var(--color-success)" },
  "on-track": { label: "On track with the calendar", color: "var(--color-accent-strong)" },
  behind: { label: "Spending faster than the month is passing", color: "var(--color-danger)" },
};

/** Compares % of budget spent vs. % of the month elapsed, feature-doc's "burn rate" bar. */
export function BurnRatePanel({ burnRate }: { burnRate: BurnRate }) {
  const spentPct = Math.round(burnRate.spentFraction * 100);
  const timePct = Math.round(burnRate.timeFraction * 100);
  const pace = PACE_COPY[burnRate.pace];

  return (
    <div className="neu-raised p-6 sm:p-8">
      <h3 className="font-(family-name:--font-display) text-xl italic text-(--color-accent-strong)">
        Money burn rate
      </h3>
      <p className="mt-2 text-sm text-(--color-text-secondary)">
        You have spent <span className="tabular text-(--color-text-primary)">{spentPct}%</span> of budget after{" "}
        <span className="tabular text-(--color-text-primary)">{timePct}%</span> of the month.
      </p>
      <div className="neu-inset relative mt-4 h-3 w-full overflow-hidden">
        <div
          className="h-full transition-[width] duration-500 ease-out"
          style={{ width: `${Math.min(100, spentPct)}%`, backgroundColor: pace.color }}
        />
        <div
          className="absolute top-0 h-full w-[2px] bg-(--color-text-primary)/60"
          style={{ left: `${Math.min(100, timePct)}%` }}
          title="Today"
        />
      </div>
      <p className="mt-3 text-xs" style={{ color: pace.color }}>
        {pace.label}
      </p>
    </div>
  );
}