"use client";

import type { SpendIntensity } from "@/lib/budget";

const INTENSITY_COLOR: Record<SpendIntensity, string> = {
  none: "var(--color-surface-inset)",
  light: "rgba(216, 182, 115, 0.35)",
  normal: "rgba(216, 182, 115, 0.65)",
  heavy: "var(--color-danger)",
};

const INTENSITY_LABEL: Record<SpendIntensity, string> = {
  none: "No spend",
  light: "Light",
  normal: "Normal",
  heavy: "Heavy spending",
};

/** GitHub-style spending calendar - one cell per day, colored by spend intensity relative to average. */
export function SpendingHeatmap({ days }: { days: { date: string; intensity: SpendIntensity }[] }) {
  const weeks: { date: string; intensity: SpendIntensity }[][] = [];
  for (let i = 0; i < days.length; i += 7) {
    weeks.push(days.slice(i, i + 7));
  }

  return (
    <div className="neu-raised p-6 sm:p-8">
      <div className="flex items-center justify-between gap-3">
        <h3 className="font-(family-name:--font-display) text-xl italic text-(--color-accent-strong)">
          Spending heatmap
        </h3>
        <div className="flex items-center gap-2 text-[10px] text-(--color-text-muted)">
          {(Object.keys(INTENSITY_LABEL) as SpendIntensity[]).map((key) => (
            <span key={key} className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 rounded-[2px]"
                style={{ backgroundColor: INTENSITY_COLOR[key] }}
              />
              {INTENSITY_LABEL[key]}
            </span>
          ))}
        </div>
      </div>
      <div className="mt-5 flex gap-1 overflow-x-auto pb-2">
        {weeks.map((week, wi) => (
          <div key={wi} className="flex flex-col gap-1">
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date} \u00b7 ${INTENSITY_LABEL[day.intensity]}`}
                className="h-3 w-3 rounded-[2px] transition-transform duration-150 hover:scale-125"
                style={{ backgroundColor: INTENSITY_COLOR[day.intensity] }}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}