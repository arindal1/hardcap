"use client";

import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import type { GroupWithBalance } from "@/lib/types";

export function SpendVsBudgetChart({ groups }: { groups: GroupWithBalance[] }) {
  const data = groups.map((g) => ({ name: g.name, cap: g.cap, spent: g.spent }));

  return (
    <div className="neu-raised p-4 sm:p-6">
      <p className="eyebrow mb-6">Spend vs. budget</p>
      <ResponsiveContainer width="100%" height={260}>
        <BarChart data={data} margin={{ left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.08)" />
          <XAxis dataKey="name" stroke="var(--color-text-muted)" fontSize={10} interval={0} tickMargin={8} />
          <YAxis stroke="var(--color-text-muted)" fontSize={10} width={48} />
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