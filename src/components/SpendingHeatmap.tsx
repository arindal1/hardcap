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

const DAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type Day = { date: string; intensity: SpendIntensity };

/** GitHub-style spending calendar - one cell per day, colored by spend intensity relative to average. */
export function SpendingHeatmap({ days }: { days: Day[] }) {
  // Keep only the last ~2 calendar months' worth of days.
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - 60);
  const cutoffStr = cutoff.toISOString().slice(0, 10);
  const recentDays = days.filter((d) => d.date >= cutoffStr);

  // Pad the front so the first column starts on Sunday.
  const firstDow = recentDays.length > 0 ? new Date(recentDays[0].date).getDay() : 0;
  const padded: (Day | null)[] = [...Array(firstDow).fill(null), ...recentDays];

  const weeks: (Day | null)[][] = [];
  for (let i = 0; i < padded.length; i += 7) {
    const week = padded.slice(i, i + 7);
    while (week.length < 7) week.push(null);
    weeks.push(week);
  }

  // Month label above the first week column that contains day-of-month <= 7.
  const monthLabels = weeks.map((week) => {
    const firstDay = week.find((d) => d !== null);
    if (!firstDay) return null;
    const date = new Date(firstDay.date);
    return date.getDate() <= 7
      ? date.toLocaleDateString(undefined, { month: "short" })
      : null;
  });

  return (
    <div className="neu-raised p-6 sm:p-8">
      <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-2">
        <h3 className="font-(family-name:--font-display) text-xl italic text-(--color-accent-strong)">
          Spending heatmap
        </h3>
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-[10px] text-(--color-text-muted)">
          {(Object.keys(INTENSITY_LABEL) as SpendIntensity[]).map((key) => (
            <span key={key} className="flex items-center gap-1">
              <span
                className="inline-block h-2.5 w-2.5 shrink-0 rounded-[2px]"
                style={{ backgroundColor: INTENSITY_COLOR[key] }}
              />
              {INTENSITY_LABEL[key]}
            </span>
          ))}
        </div>
      </div>

      <div className="mt-6 flex justify-center">
        <div className="w-full max-w-2xl">
          {/* Month row */}
          <div className="flex pl-9 sm:pl-11">
            <div
              className="grid flex-1 gap-1.5"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
            >
              {monthLabels.map((label, wi) => (
                <div
                  key={wi}
                  className="pb-1 text-xs font-medium tracking-wide text-(--color-text-muted)"
                >
                  {label}
                </div>
              ))}
            </div>
          </div>

          <div className="flex gap-1.5">
            {/* Day-of-week labels */}
            <div className="grid w-7 shrink-0 gap-1.5 sm:w-9">
              {DAY_LABELS.map((label, i) => (
                <div
                  key={label}
                  className="flex items-center justify-end pr-1.5 text-xs text-(--color-text-muted)"
                  style={{ aspectRatio: "1 / 1" }}
                >
                  {i % 2 === 1 ? label.slice(0, 3) : ""}
                </div>
              ))}
            </div>

            {/* Week columns as a CSS grid so cells stretch to fill width */}
            <div
              className="grid flex-1 gap-1.5"
              style={{ gridTemplateColumns: `repeat(${weeks.length}, minmax(0, 1fr))` }}
            >
              {weeks.map((week, wi) => (
                <div key={wi} className="grid gap-1.5">
                  {week.map((day, di) =>
                    day ? (
                      <div
                        key={day.date}
                        title={`${day.date} \u00b7 ${INTENSITY_LABEL[day.intensity]}`}
                        className="rounded-[3px] transition-transform duration-150 hover:scale-110"
                        style={{
                          backgroundColor: INTENSITY_COLOR[day.intensity],
                          aspectRatio: "1 / 1",
                        }}
                      />
                    ) : (
                      <div key={di} style={{ aspectRatio: "1 / 1" }} />
                    ),
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}