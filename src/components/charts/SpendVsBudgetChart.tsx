"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GroupWithBalance } from "@/lib/types";

export function SpendVsBudgetChart({ groups }: { groups: GroupWithBalance[] }) {
  const data = groups.map((g) => ({ name: g.name, cap: g.cap, spent: g.spent }));

  return (
    <div className="neu-raised p-6">
      <h3 className="mb-4 text-sm text-(--color-text-secondary)">Spend vs. budget</h3>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={12} />
          <YAxis stroke="var(--color-text-muted)" fontSize={12} />
          <Tooltip
            contentStyle={{
              background: "var(--color-surface)",
              border: "none",
              borderRadius: 8,
              color: "var(--color-text-primary)",
            }}
          />
          <Bar dataKey="cap" fill="var(--color-text-muted)" radius={[4, 4, 0, 0]} name="Cap" />
          <Bar dataKey="spent" fill="var(--color-accent)" radius={[4, 4, 0, 0]} name="Spent" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}