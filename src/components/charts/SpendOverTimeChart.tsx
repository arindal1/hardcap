"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

export interface DailyPoint {
  date: string;
  cumulativeSpent: number;
  remaining: number;
}

export function SpendOverTimeChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="neu-raised p-4 sm:p-6">
      <p className="eyebrow mb-6">Spend over time</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={10} interval="preserveStartEnd" tickMargin={8} />
          <YAxis stroke="var(--color-text-muted)" fontSize={10} width={48} />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "none",
              borderRadius: 8,
              color: "var(--color-text-primary)",
            }}
          />
          <Line
            type="monotone"
            dataKey="cumulativeSpent"
            stroke="var(--color-accent)"
            strokeWidth={2}
            dot={false}
            name="Cumulative spend"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}