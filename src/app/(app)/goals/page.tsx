"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useGoals } from "@/lib/queries";
import { apiFetch } from "@/lib/api-client";
import { NeuInput } from "@/components/NeuInput";
import { NeuButton } from "@/components/NeuButton";
import { RevealOnMount } from "@/components/RevealOnMount";
import { ScrollReveal } from "@/components/ScrollReveal";
import { fireConfetti } from "@/lib/confetti";

function currency(n: number) {
  return n.toLocaleString("en-IN", { style: "currency", currency: "INR" });
}

export default function GoalsPage() {
  const { data: goals, isLoading } = useGoals();
  const queryClient = useQueryClient();

  const [name, setName] = useState("");
  const [targetAmount, setTargetAmount] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [contributingId, setContributingId] = useState<string | null>(null);
  const [contributeAmount, setContributeAmount] = useState("");

  const totalSaved = goals?.reduce((sum, g) => sum + g.savedAmount, 0) ?? 0;

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/goals", {
        method: "POST",
        body: JSON.stringify({ name, targetAmount: Number(targetAmount) }),
      });
      setName("");
      setTargetAmount("");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create goal");
    }
  }

  async function handleDelete(id: string) {
    await apiFetch(`/api/goals/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["goals"] });
  }

  async function handleContribute(id: string, sign: 1 | -1) {
    setError(null);
    const amount = Number(contributeAmount);
    if (!amount) return;
    try {
      const goal = await apiFetch<{ isCompleted: boolean }>(`/api/goals/${id}/contribute`, {
        method: "POST",
        body: JSON.stringify({ amount: amount * sign }),
      });
      setContributingId(null);
      setContributeAmount("");
      queryClient.invalidateQueries({ queryKey: ["goals"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      if (goal.isCompleted) fireConfetti();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update goal");
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <p className="eyebrow">01 - Goal savings</p>
        <h1 className="mt-4 font-(family-name:--font-display) text-4xl italic text-(--color-text-primary) sm:text-5xl">
          Pots you don&apos;t touch.
        </h1>
        <p className="mt-3 text-sm text-(--color-text-muted)">
          Money allocated here is set aside from unallocated income - it can&apos;t be assigned to a
          budget group and carries forward until the goal is complete. Total saved: {currency(totalSaved)}
        </p>
      </section>

      <form onSubmit={handleCreate} className="neu-raised flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-6">
        <div className="w-full sm:min-w-[200px] sm:flex-1">
          <NeuInput label="Goal name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="w-full sm:min-w-[160px]">
          <NeuInput
            label="Target amount"
            type="number"
            min="0.01"
            step="0.01"
            value={targetAmount}
            onChange={(e) => setTargetAmount(e.target.value)}
            required
          />
        </div>
        <NeuButton type="submit" variant="accent" className="w-full sm:w-auto">
          Add goal
        </NeuButton>
      </form>
      {error && <p className="text-sm text-(--color-danger)">{error}</p>}

      {isLoading ? (
        <p className="text-(--color-text-muted)">Loading…</p>
      ) : (
        <ScrollReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger>
          {goals?.map((goal) => {
            const pct = Math.min(100, (goal.savedAmount / goal.targetAmount) * 100);
            return (
              <RevealOnMount key={goal.id}>
                <div className="neu-raised neu-pressable flex flex-col gap-3 p-6 transition-transform duration-300 hover:-translate-y-1">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="flex min-w-0 items-center gap-2 truncate font-medium">
                      <span aria-hidden>{goal.icon}</span>
                      <span className="truncate">{goal.name}</span>
                      {goal.isCompleted && (
                        <span className="shrink-0 text-xs text-(--color-success)">Complete</span>
                      )}
                    </h3>
                    <button
                      onClick={() => handleDelete(goal.id)}
                      className="focus-ring shrink-0 text-xs text-(--color-text-muted) hover:text-(--color-danger)"
                    >
                      Delete
                    </button>
                  </div>
                  <p className="tabular text-2xl text-(--color-text-primary)">
                    {currency(goal.savedAmount)} <span className="text-sm text-(--color-text-muted)">/ {currency(goal.targetAmount)}</span>
                  </p>
                  <div className="neu-inset h-2 w-full overflow-hidden">
                    <div
                      className="h-full transition-[width] duration-500 ease-out"
                      style={{ width: `${pct}%`, backgroundColor: "var(--color-accent)" }}
                    />
                  </div>
                  {contributingId === goal.id ? (
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-end">
                      <div className="flex-1">
                        <NeuInput
                          label="Amount"
                          type="number"
                          min="0.01"
                          step="0.01"
                          value={contributeAmount}
                          onChange={(e) => setContributeAmount(e.target.value)}
                          autoFocus
                        />
                      </div>
                      <div className="flex gap-2">
                        <NeuButton type="button" variant="accent" onClick={() => handleContribute(goal.id, 1)}>
                          Add
                        </NeuButton>
                        <NeuButton type="button" onClick={() => handleContribute(goal.id, -1)}>
                          Withdraw
                        </NeuButton>
                        <NeuButton type="button" onClick={() => setContributingId(null)}>
                          Cancel
                        </NeuButton>
                      </div>
                    </div>
                  ) : (
                    <button
                      onClick={() => setContributingId(goal.id)}
                      className="focus-ring w-fit text-xs text-(--color-text-muted) hover:text-(--color-accent)"
                    >
                      Contribute / withdraw
                    </button>
                  )}
                </div>
              </RevealOnMount>
            );
          })}
        </ScrollReveal>
      )}
    </div>
  );
}