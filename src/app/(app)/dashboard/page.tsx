"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardSummary, useExpenses } from "@/lib/queries";
import { apiFetch } from "@/lib/api-client";
import { RevealOnMount } from "@/components/RevealOnMount";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AmbientField } from "@/components/AmbientField";
import { NeuInput } from "@/components/NeuInput";
import { NeuButton } from "@/components/NeuButton";
import { SpendVsBudgetChart } from "@/components/charts/SpendVsBudgetChart";
import { SpendOverTimeChart, type DailyPoint } from "@/components/charts/SpendOverTimeChart";
import { OverallBalanceTrendChart } from "@/components/charts/OverallBalanceTrendChart";

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

function currentMonthPrefix() {
  return new Date().toISOString().slice(0, 7);
}

function buildDailySeries(
  expenses: { amount: string | number; spentAt: string }[] | undefined,
  monthlyIncome: number
): DailyPoint[] {
  if (!expenses) return [];
  const month = currentMonthPrefix();
  const spentByDay = new Map<string, number>();
  for (const expense of expenses) {
    const day = expense.spentAt.slice(0, 10);
    if (!day.startsWith(month)) continue;
    spentByDay.set(day, (spentByDay.get(day) ?? 0) + Number(expense.amount));
  }
  const days = Array.from(spentByDay.keys()).sort();
  let cumulative = 0;
  return days.map((date) => {
    cumulative += spentByDay.get(date) ?? 0;
    return { date, cumulativeSpent: cumulative, remaining: monthlyIncome - cumulative };
  });
}

export default function DashboardPage() {
  const { data, isLoading, error } = useDashboardSummary();
  const { data: expenses } = useExpenses();
  const queryClient = useQueryClient();
  const [income, setIncome] = useState("");
  const [editingIncome, setEditingIncome] = useState(false);
  const dailySeries = useMemo(
    () => buildDailySeries(expenses, data?.monthlyIncome ?? 0),
    [expenses, data?.monthlyIncome]
  );

  async function handleIncomeSubmit(e: React.FormEvent) {
    e.preventDefault();
    await apiFetch("/api/me", {
      method: "PATCH",
      body: JSON.stringify({ monthlyIncome: Number(income) }),
    });
    setEditingIncome(false);
    setIncome("");
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  }

  if (isLoading) return <p className="text-(--color-text-muted)">Loading…</p>;
  if (error || !data) return <p className="text-(--color-danger)">Failed to load dashboard.</p>;

  return (
    <div className="flex flex-col gap-10">
      <AmbientField />

      <RevealOnMount>
        <section className="neu-raised p-6 sm:p-10">
          <p className="eyebrow">01 — Overall remaining</p>
          <p
            className={`tabular mt-6 font-(family-name:--font-display) text-6xl italic leading-none sm:text-7xl lg:text-8xl ${
              data.overallRemaining < 0 ? "text-(--color-danger)" : "text-(--color-accent-strong)"
            }`}
          >
            {currency(data.overallRemaining)}
          </p>
          <div className="hairline my-6 max-w-xs" />
          <p className="text-sm text-(--color-text-secondary)">
            {currency(data.totalSpent)} spent of {currency(data.monthlyIncome)} income
          </p>
          <p className="mt-1 text-xs text-(--color-text-muted)">
            Unallocated income: {currency(data.unallocatedIncome)}
          </p>
          {editingIncome ? (
            <form onSubmit={handleIncomeSubmit} className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-40">
                <NeuInput
                  label="Monthly income"
                  type="number"
                  min="0"
                  step="0.01"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  required
                  autoFocus
                />
              </div>
              <NeuButton type="submit" variant="accent">
                Save
              </NeuButton>
            </form>
          ) : (
            <button
              onClick={() => setEditingIncome(true)}
              className="focus-ring mt-4 text-xs text-(--color-text-muted) hover:text-(--color-accent)"
            >
              Update income
            </button>
          )}
        </section>
      </RevealOnMount>

      <section className="flex flex-col gap-5">
        <p className="eyebrow">02 — Groups at a glance</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.groups.map((group, i) => (
            <RevealOnMount key={group.id} delay={i * 0.05}>
              <div className="neu-raised neu-pressable p-6 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="truncate font-medium">{group.name}</h3>
                  {group.isOverCap && (
                    <span className="shrink-0 text-xs text-(--color-danger)">
                      Over by {currency(group.overageAmount)}
                    </span>
                  )}
                </div>
                <p
                  className={`tabular mt-3 text-3xl ${
                    group.isOverCap ? "text-(--color-danger)" : "text-(--color-text-primary)"
                  }`}
                >
                  {currency(group.remaining)}
                </p>
                <p className="mt-1 text-xs text-(--color-text-muted)">
                  {currency(group.spent)} of {currency(group.cap)} cap
                </p>
                <div className="neu-inset mt-4 h-2 w-full overflow-hidden">
                  <div
                    className={`h-full transition-[width] duration-500 ease-out ${
                      group.isOverCap ? "bg-(--color-danger)" : "bg-(--color-accent)"
                    }`}
                    style={{ width: `${Math.min(100, (group.spent / group.cap) * 100)}%` }}
                  />
                </div>
              </div>
            </RevealOnMount>
          ))}
        </div>
      </section>

      <ScrollReveal className="flex flex-col gap-5" stagger>
        <p className="eyebrow">03 — Charts</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SpendVsBudgetChart groups={data.groups} />
          <SpendOverTimeChart data={dailySeries} />
          <div className="lg:col-span-2">
            <OverallBalanceTrendChart data={dailySeries} />
          </div>
        </div>
      </ScrollReveal>
    </div>
  );
}