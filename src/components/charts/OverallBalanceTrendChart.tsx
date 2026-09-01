"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { DailyPoint } from "./SpendOverTimeChart";

export function OverallBalanceTrendChart({ data }: { data: DailyPoint[] }) {
  return (
    <div className="neu-raised p-6">
      <h3 className="mb-4 text-sm text-(--color-text-secondary)">Balance remaining over the month</h3>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="date" stroke="var(--color-text-muted)" fontSize={12} />
          <YAxis stroke="var(--color-text-muted)" fontSize={12} />
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
            dataKey="remaining"
            stroke="var(--color-accent-strong)"
            strokeWidth={2}
            dot={false}
            name="Remaining balance"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}