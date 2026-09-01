"use client";

import { useMemo, useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useExpenses, useGroups } from "@/lib/queries";
import { apiFetch } from "@/lib/api-client";
import { NeuInput } from "@/components/NeuInput";
import { NeuSelect } from "@/components/NeuSelect";
import { NeuButton } from "@/components/NeuButton";
import { ScrollReveal } from "@/components/ScrollReveal";

type SortKey = "spentAt" | "amount";

export default function ExpensesPage() {
  const { data: groups } = useGroups();
  const [filterGroupId, setFilterGroupId] = useState("");
  const [filterFrom, setFilterFrom] = useState("");
  const [filterTo, setFilterTo] = useState("");
  const { data: expenses, isLoading } = useExpenses({
    groupId: filterGroupId || undefined,
    from: filterFrom ? new Date(filterFrom).toISOString() : undefined,
    to: filterTo ? new Date(filterTo).toISOString() : undefined,
  });
  const queryClient = useQueryClient();

  const [amount, setAmount] = useState("");
  const [groupId, setGroupId] = useState("");
  const [note, setNote] = useState("");
  const [spentAt, setSpentAt] = useState("");
  const [error, setError] = useState<string | null>(null);

  const [sortKey, setSortKey] = useState<SortKey>("spentAt");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editAmount, setEditAmount] = useState("");
  const [editGroupId, setEditGroupId] = useState("");
  const [editNote, setEditNote] = useState("");

  const sortedExpenses = useMemo(() => {
    if (!expenses) return expenses;
    const sorted = [...expenses].sort((a, b) => {
      const av = sortKey === "amount" ? Number(a.amount) : new Date(a.spentAt).getTime();
      const bv = sortKey === "amount" ? Number(b.amount) : new Date(b.spentAt).getTime();
      return sortDir === "asc" ? av - bv : bv - av;
    });
    return sorted;
  }, [expenses, sortKey, sortDir]);

  function toggleSort(key: SortKey) {
    if (sortKey === key) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"));
    } else {
      setSortKey(key);
      setSortDir("desc");
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/expenses", {
        method: "POST",
        body: JSON.stringify({
          amount: Number(amount),
          groupId,
          note: note || undefined,
          spentAt: spentAt ? new Date(spentAt).toISOString() : undefined,
        }),
      });
      // Keep group selection for rapid repeat entry; clear amount/note/date only.
      setAmount("");
      setNote("");
      setSpentAt("");
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to log expense");
    }
  }

  async function handleDelete(id: string) {
    await apiFetch(`/api/expenses/${id}`, { method: "DELETE" });
    queryClient.invalidateQueries({ queryKey: ["expenses"] });
    queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
    queryClient.invalidateQueries({ queryKey: ["groups"] });
  }

  function startEdit(id: string, currentAmount: string | number, currentGroupId: string, currentNote: string | null) {
    setEditingId(id);
    setEditAmount(String(currentAmount));
    setEditGroupId(currentGroupId);
    setEditNote(currentNote ?? "");
  }

  async function handleEditSave(id: string) {
    setError(null);
    try {
      await apiFetch(`/api/expenses/${id}`, {
        method: "PATCH",
        body: JSON.stringify({
          amount: Number(editAmount),
          groupId: editGroupId,
          note: editNote || undefined,
        }),
      });
      setEditingId(null);
      queryClient.invalidateQueries({ queryKey: ["expenses"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-summary"] });
      queryClient.invalidateQueries({ queryKey: ["groups"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update expense");
    }
  }

  return (
    <div className="flex flex-col gap-10">
      <section>
        <p className="eyebrow">01 - Ledger</p>
        <h1 className="mt-4 font-(family-name:--font-display) text-4xl italic text-(--color-text-primary) sm:text-5xl">
          Every dollar, logged.
        </h1>
      </section>

      <form onSubmit={handleSubmit} className="neu-raised flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-6">
        <div className="w-full sm:w-32">
          <NeuInput
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
            autoFocus
          />
        </div>
        <div className="min-w-[180px]">
          <NeuSelect label="Group" value={groupId} onChange={(e) => setGroupId(e.target.value)} required>
            <option value="" disabled>
              Select group
            </option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </NeuSelect>
        </div>
        <div className="min-w-[200px] flex-1">
          <NeuInput label="Note (optional)" value={note} onChange={(e) => setNote(e.target.value)} />
        </div>
        <div className="w-full sm:w-52">
          <NeuInput
            label="When (optional, defaults to now)"
            type="datetime-local"
            value={spentAt}
            onChange={(e) => setSpentAt(e.target.value)}
          />
        </div>
        <NeuButton type="submit" variant="accent" className="w-full sm:w-auto">
          Log expense
        </NeuButton>
      </form>
      {error && <p className="text-sm text-(--color-danger)">{error}</p>}

      <div className="neu-raised flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-6">
        <div className="sm:min-w-[180px]">
          <NeuSelect label="Filter by group" value={filterGroupId} onChange={(e) => setFilterGroupId(e.target.value)}>
            <option value="">All groups</option>
            {groups?.map((g) => (
              <option key={g.id} value={g.id}>
                {g.name}
              </option>
            ))}
          </NeuSelect>
        </div>
        <div className="w-full sm:w-44">
          <NeuInput label="From" type="date" value={filterFrom} onChange={(e) => setFilterFrom(e.target.value)} />
        </div>
        <div className="w-full sm:w-44">
          <NeuInput label="To" type="date" value={filterTo} onChange={(e) => setFilterTo(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <p className="text-(--color-text-muted)">Loading…</p>
      ) : (
        <>
        <ScrollReveal className="flex flex-col gap-4 md:hidden" stagger>
          {sortedExpenses?.map((expense) =>
            editingId === expense.id ? (
              <div key={expense.id} className="neu-raised flex flex-col gap-4 p-4">
                <NeuInput
                  label="Amount"
                  type="number"
                  min="0.01"
                  step="0.01"
                  value={editAmount}
                  onChange={(e) => setEditAmount(e.target.value)}
                />
                <NeuSelect label="Group" value={editGroupId} onChange={(e) => setEditGroupId(e.target.value)}>
                  {groups?.map((g) => (
                    <option key={g.id} value={g.id}>
                      {g.name}
                    </option>
                  ))}
                </NeuSelect>
                <NeuInput label="Note (optional)" value={editNote} onChange={(e) => setEditNote(e.target.value)} />
                <div className="flex gap-3">
                  <NeuButton type="button" variant="accent" onClick={() => handleEditSave(expense.id)}>
                    Save
                  </NeuButton>
                  <NeuButton type="button" onClick={() => setEditingId(null)}>
                    Cancel
                  </NeuButton>
                </div>
              </div>
            ) : (
              <div key={expense.id} className="neu-raised neu-pressable flex flex-col gap-2 p-4 transition-transform duration-300 hover:-translate-y-1">
                <div className="flex items-start justify-between gap-3">
                  <p className="tabular text-lg">{Number(expense.amount).toLocaleString()}</p>
                  <p className="shrink-0 text-xs text-(--color-text-muted)">
                    {new Date(expense.spentAt).toLocaleDateString()}
                  </p>
                </div>
                <p className="truncate text-sm text-(--color-text-secondary)">{expense.group?.name}</p>
                {expense.note && <p className="text-sm text-(--color-text-muted)">{expense.note}</p>}
                <div className="mt-2 flex gap-4 border-t border-white/5 pt-2 text-sm">
                  <button
                    onClick={() => startEdit(expense.id, expense.amount, expense.groupId, expense.note)}
                    className="focus-ring text-(--color-text-muted) hover:text-(--color-accent)"
                  >
                    Edit
                  </button>
                  <button
                    onClick={() => handleDelete(expense.id)}
                    className="focus-ring text-(--color-text-muted) hover:text-(--color-danger)"
                  >
                    Delete
                  </button>
                </div>
              </div>
            )
          )}
        </ScrollReveal>
        <div className="neu-raised hidden overflow-x-auto md:block">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="text-(--color-text-muted)">
              <tr>
                <th className="px-6 py-4">
                  <button onClick={() => toggleSort("spentAt")} className="focus-ring hover:text-(--color-accent)">
                    Date {sortKey === "spentAt" && (sortDir === "asc" ? "↑" : "↓")}
                  </button>
                </th>
                <th className="px-6 py-4">Group</th>
                <th className="px-6 py-4">
                  <button onClick={() => toggleSort("amount")} className="focus-ring hover:text-(--color-accent)">
                    Amount {sortKey === "amount" && (sortDir === "asc" ? "↑" : "↓")}
                  </button>
                </th>
                <th className="px-6 py-4">Note</th>
                <th className="px-6 py-4" />
              </tr>
            </thead>
            <tbody>
              {sortedExpenses?.map((expense) =>
                editingId === expense.id ? (
                  <tr key={expense.id} className="border-t border-white/5">
                    <td className="px-6 py-3" colSpan={5}>
                      <div className="flex flex-wrap items-end gap-4">
                        <div className="w-32">
                          <NeuInput
                            label="Amount"
                            type="number"
                            min="0.01"
                            step="0.01"
                            value={editAmount}
                            onChange={(e) => setEditAmount(e.target.value)}
                          />
                        </div>
                        <div className="min-w-[180px]">
                          <NeuSelect label="Group" value={editGroupId} onChange={(e) => setEditGroupId(e.target.value)}>
                            {groups?.map((g) => (
                              <option key={g.id} value={g.id}>
                                {g.name}
                              </option>
                            ))}
                          </NeuSelect>
                        </div>
                        <div className="min-w-[200px] flex-1">
                          <NeuInput
                            label="Note (optional)"
                            value={editNote}
                            onChange={(e) => setEditNote(e.target.value)}
                          />
                        </div>
                        <NeuButton type="button" variant="accent" onClick={() => handleEditSave(expense.id)}>
                          Save
                        </NeuButton>
                        <NeuButton type="button" onClick={() => setEditingId(null)}>
                          Cancel
                        </NeuButton>
                      </div>
                    </td>
                  </tr>
                ) : (
                  <tr key={expense.id} className="border-t border-white/5">
                    <td className="px-6 py-3">{new Date(expense.spentAt).toLocaleDateString()}</td>
                    <td className="px-6 py-3">{expense.group?.name}</td>
                    <td className="tabular px-6 py-3">{Number(expense.amount).toLocaleString()}</td>
                    <td className="px-6 py-3 text-(--color-text-muted)">{expense.note}</td>
                    <td className="px-6 py-3 text-right">
                      <div className="flex justify-end gap-3">
                        <button
                          onClick={() => startEdit(expense.id, expense.amount, expense.groupId, expense.note)}
                          className="focus-ring text-(--color-text-muted) hover:text-(--color-accent)"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(expense.id)}
                          className="focus-ring text-(--color-text-muted) hover:text-(--color-danger)"
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                )
              )}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}