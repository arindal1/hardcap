"use client";

import { useEffect, useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardSummary, useExpenses } from "@/lib/queries";
import { apiFetch } from "@/lib/api-client";
import { RevealOnMount } from "@/components/RevealOnMount";
import { ScrollReveal } from "@/components/ScrollReveal";
import { AmbientField } from "@/components/AmbientField";
import { NeuInput } from "@/components/NeuInput";
import { NeuButton } from "@/components/NeuButton";
import { AnimatedNumber } from "@/components/AnimatedNumber";
import { SpendVsBudgetChart } from "@/components/charts/SpendVsBudgetChart";
import { SpendOverTimeChart, type DailyPoint } from "@/components/charts/SpendOverTimeChart";
import { OverallBalanceTrendChart } from "@/components/charts/OverallBalanceTrendChart";
import { BurnRatePanel } from "@/components/BurnRatePanel";
import { SpendingHeatmap } from "@/components/SpendingHeatmap";
import { groupColor } from "@/lib/group-style";
import { fireConfetti } from "@/lib/confetti";
import type { BudgetHealthGrade } from "@/lib/budget";

function currency(n: number) {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

const HEALTH_GRADE_COLOR: Record<BudgetHealthGrade, string> = {
  A: "var(--color-success)",
  B: "var(--color-success)",
  C: "var(--color-accent-strong)",
  D: "var(--color-danger)",
  F: "var(--color-danger)",
};

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

  // Celebrate once per month, the first time the dashboard loads after a
  // month closed under budget - localStorage flag stops it firing every visit.
  useEffect(() => {
    if (data?.previousMonthClosedUnderBudget !== true) return;
    const key = `hardcap-confetti-shown-${currentMonthPrefix()}`;
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, "1");
    fireConfetti();
  }, [data?.previousMonthClosedUnderBudget]);

  if (isLoading) return <p className="text-(--color-text-muted)">Loading…</p>;
  if (error || !data) return <p className="text-(--color-danger)">Failed to load dashboard.</p>;

  return (
    <div className="flex flex-col gap-10">
      <AmbientField intensity={data.burnRate.spentFraction} />

      <RevealOnMount>
        <section className="neu-raised p-6 sm:p-10">
          <p className="eyebrow">01 - Overall remaining</p>
          <AnimatedNumber
            value={data.overallRemaining}
            formatter={currency}
            className={`tabular mt-6 block break-words font-(family-name:--font-display) text-4xl italic leading-none sm:text-6xl lg:text-8xl ${
              data.overallRemaining < 0 ? "text-(--color-danger)" : "text-(--color-accent-strong)"
            }`}
          />
          <div className="hairline my-6 max-w-xs" />
          <p className="text-sm text-(--color-text-secondary)">
            <AnimatedNumber value={data.totalSpent} formatter={currency} /> spent of{" "}
            <AnimatedNumber value={data.monthlyIncome} formatter={currency} /> income
          </p>
          <p className="mt-1 text-xs text-(--color-text-muted)">
            Unallocated income: <AnimatedNumber value={data.unallocatedIncome} formatter={currency} />
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

      <RevealOnMount delay={0.05}>
        <section className="neu-raised flex flex-col items-start gap-4 p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <p className="eyebrow">02 - Budget health</p>
            <p className="mt-2 text-sm text-(--color-text-muted)">
              {data.budgetHealth.monthsConsidered > 0
                ? `Over cap in ${Math.round(data.budgetHealth.overageFrequency * 100)}% of the last ${data.budgetHealth.monthsConsidered} group-month${data.budgetHealth.monthsConsidered === 1 ? "" : "s"}`
                : "Not enough completed months yet to score"}
            </p>
          </div>
          <p
            className="font-(family-name:--font-display) text-6xl italic leading-none"
            style={{ color: HEALTH_GRADE_COLOR[data.budgetHealth.grade] }}
          >
            {data.budgetHealth.grade}
          </p>
        </section>
      </RevealOnMount>

      <section className="flex flex-col gap-5">
        <p className="eyebrow">03 - Groups at a glance</p>
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {data.groups.map((group, i) => {
            const color = groupColor(group.color);
            return (
              <RevealOnMount key={group.id} delay={i * 0.05}>
                <div className="neu-raised neu-pressable p-6 transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex min-w-0 items-center gap-2 truncate font-medium">
                      <span aria-hidden>{group.icon}</span>
                      <span className="truncate">{group.name}</span>
                    </h3>
                    {group.isOverCap && (
                      <span className="shrink-0 text-xs text-(--color-danger)">
                        Over by {currency(group.overageAmount)}
                      </span>
                    )}
                  </div>
                  <AnimatedNumber
                    value={group.remaining}
                    formatter={currency}
                    className={`tabular mt-3 block text-3xl ${
                      group.isOverCap ? "text-(--color-danger)" : "text-(--color-text-primary)"
                    }`}
                  />
                  <p className="mt-1 text-xs text-(--color-text-muted)">
                    {currency(group.spent)} of {currency(group.cap)} cap
                    {group.rolloverEnabled && group.rolloverAmount > 0 && (
                      <> · +{currency(group.rolloverAmount)} rolled over</>
                    )}
                  </p>
                  <div className="neu-inset mt-4 h-2 w-full overflow-hidden">
                    <div
                      className="h-full transition-[width] duration-500 ease-out"
                      style={{
                        width: `${Math.min(100, (group.spent / group.cap) * 100)}%`,
                        backgroundColor: group.isOverCap ? "var(--color-danger)" : color.accent,
                      }}
                    />
                  </div>
                </div>
              </RevealOnMount>
            );
          })}
        </div>
      </section>

      <ScrollReveal className="flex flex-col gap-5" stagger>
        <p className="eyebrow">04 - Charts</p>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
          <SpendVsBudgetChart groups={data.groups} />
          <SpendOverTimeChart data={dailySeries} />
          <div className="lg:col-span-2">
            <OverallBalanceTrendChart data={dailySeries} />
          </div>
        </div>
      </ScrollReveal>

      <ScrollReveal className="grid grid-cols-1 gap-5 lg:grid-cols-2" stagger>
        <p className="eyebrow lg:col-span-2">05 - Pace &amp; patterns</p>
        <BurnRatePanel burnRate={data.burnRate} />
        <div className="lg:col-span-2">
          <SpendingHeatmap days={data.spendHeatmap} />
        </div>
      </ScrollReveal>
    </div>
  );
}