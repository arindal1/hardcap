"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useDashboardSummary, useGroups } from "@/lib/queries";
import { apiFetch } from "@/lib/api-client";
import { NeuInput } from "@/components/NeuInput";
import { NeuButton } from "@/components/NeuButton";
import { ScrollReveal } from "@/components/ScrollReveal";

function currency(n: number) {
  return n.toLocaleString(undefined, { style: "currency", currency: "USD" });
}

export default function GroupsPage() {
  const { data: groups, isLoading } = useGroups();
  const { data: summary } = useDashboardSummary();
  const queryClient = useQueryClient();
  const [name, setName] = useState("");
  const [budgetCap, setBudgetCap] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editCap, setEditCap] = useState("");

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/groups", {
        method: "POST",
        body: JSON.stringify({ name, budgetCap: Number(budgetCap) }),
      });
      setName("");
      setBudgetCap("");
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create group");
    }
  }

  async function handleDelete(id: string) {
    await apiFetch(`/api/groups/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
  }

  function startEdit(id: string, currentName: string, currentCap: number) {
    setEditingId(id);
    setEditName(currentName);
    setEditCap(String(currentCap));
  }

  async function handleEditSave(id: string) {
    setError(null);
    try {
      await apiFetch(`/api/groups/${id}`, {
        method: "PATCH",
        body: JSON.stringify({ name: editName, budgetCap: Number(editCap) }),
      });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["groups"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update group");
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <p className="eyebrow">01 — Budget groups</p>
        <h1 className="mt-4 font-(family-name:--font-display) text-4xl italic text-(--color-text-primary) sm:text-5xl">
          Where the caps live.
        </h1>
        {summary && (
          <p className="mt-3 text-sm text-(--color-text-muted)">
            Unallocated income: {currency(summary.unallocatedIncome)}
          </p>
        )}
      </section>

      <form onSubmit={handleCreate} className="neu-raised flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-6">
        <div className="w-full sm:min-w-[200px] sm:flex-1">
          <NeuInput label="Group name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>
        <div className="w-full sm:min-w-[160px]">
          <NeuInput
            label="Budget cap"
            type="number"
            min="0.01"
            step="0.01"
            value={budgetCap}
            onChange={(e) => setBudgetCap(e.target.value)}
            required
          />
        </div>
        <NeuButton type="submit" variant="accent" className="w-full sm:w-auto">
          Add group
        </NeuButton>
      </form>
      {error && <p className="text-sm text-(--color-danger)">{error}</p>}

      {isLoading ? (
        <p className="text-(--color-text-muted)">Loading…</p>
      ) : (
        <ScrollReveal className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3" stagger>
          {groups?.map((group) =>
            editingId === group.id ? (
              <div key={group.id} className="neu-raised flex flex-col gap-3 p-6">
                <NeuInput label="Group name" value={editName} onChange={(e) => setEditName(e.target.value)} />
                <NeuInput
                  label="Budget cap"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editCap}
                  onChange={(e) => setEditCap(e.target.value)}
                />
                <div className="flex gap-3">
                  <NeuButton type="button" variant="accent" onClick={() => handleEditSave(group.id)}>
                    Save
                  </NeuButton>
                  <NeuButton type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </NeuButton>
                </div>
              </div>
            ) : (
              <div key={group.id} className="neu-raised neu-pressable flex flex-col gap-2 p-6 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-center justify-between gap-3">
                  <h3 className="truncate font-medium">{group.name}</h3>
                  <div className="flex shrink-0 gap-3">
                    <button
                      onClick={() => startEdit(group.id, group.name, group.cap)}
                      className="focus-ring text-xs text-(--color-text-muted) hover:text-(--color-accent)"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(group.id)}
                      className="focus-ring text-xs text-(--color-text-muted) hover:text-(--color-danger)"
                    >
                      Archive
                    </button>
                  </div>
                </div>
                <p className="tabular text-sm text-(--color-text-secondary)">
                  Cap: {group.cap.toLocaleString()} · Remaining: {group.remaining.toLocaleString()}
                </p>
              </div>
            )
          )}
        </ScrollReveal>
      )}
    </div>
  );
}