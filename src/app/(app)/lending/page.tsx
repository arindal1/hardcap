"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { useLending } from "@/lib/queries";
import { apiFetch } from "@/lib/api-client";
import { NeuInput } from "@/components/NeuInput";
import { NeuButton } from "@/components/NeuButton";

export default function LendingPage() {
  const { data: entries, isLoading } = useLending();
  const queryClient = useQueryClient();

  const [personName, setPersonName] = useState("");
  const [amount, setAmount] = useState("");
  const [reason, setReason] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await apiFetch("/api/lending", {
        method: "POST",
        body: JSON.stringify({
          personName,
          amount: Number(amount),
          reason: reason || undefined,
          date: new Date(date).toISOString(),
        }),
      });
      setPersonName("");
      setAmount("");
      setReason("");
      queryClient.invalidateQueries({ queryKey: ["lending"] });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add entry");
    }
  }

  async function toggleSettled(id: string, isSettled: boolean) {
    await apiFetch(`/api/lending/${id}`, {
      method: "PATCH",
      body: JSON.stringify({ isSettled: !isSettled }),
    });
    queryClient.invalidateQueries({ queryKey: ["lending"] });
  }

  return (
    <div className="flex flex-col gap-8">
      <form onSubmit={handleSubmit} className="neu-raised flex flex-col gap-4 p-4 sm:flex-row sm:flex-wrap sm:items-end sm:p-6">
        <div className="w-full sm:min-w-[160px]">
          <NeuInput label="Name" value={personName} onChange={(e) => setPersonName(e.target.value)} required />
        </div>
        <div className="w-full sm:w-32">
          <NeuInput
            label="Amount"
            type="number"
            min="0.01"
            step="0.01"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            required
          />
        </div>
        <div className="w-full sm:w-44">
          <NeuInput label="Date" type="date" value={date} onChange={(e) => setDate(e.target.value)} required />
        </div>
        <div className="w-full sm:min-w-[200px] sm:flex-1">
          <NeuInput label="Reason (optional)" value={reason} onChange={(e) => setReason(e.target.value)} />
        </div>
        <NeuButton type="submit" variant="accent" className="w-full sm:w-auto">
          Add entry
        </NeuButton>
      </form>
      {error && <p className="text-sm text-(--color-danger)">{error}</p>}

      {isLoading ? (
        <p className="text-(--color-text-muted)">Loading…</p>
      ) : (
        <>
        <div className="flex flex-col gap-4 md:hidden">
          {entries?.map((entry) => (
            <div key={entry.id} className="neu-raised flex flex-col gap-2 p-4">
              <div className="flex items-start justify-between gap-3">
                <p className="truncate font-medium">{entry.personName}</p>
                <p className="shrink-0 text-lg">{Number(entry.amount).toLocaleString()}</p>
              </div>
              <p className="text-xs text-(--color-text-muted)">{new Date(entry.date).toLocaleDateString()}</p>
              {entry.reason && <p className="text-sm text-(--color-text-secondary)">{entry.reason}</p>}
              <button
                onClick={() => toggleSettled(entry.id, entry.isSettled)}
                className={`focus-ring mt-2 border-t border-white/5 pt-2 text-left text-sm ${
                  entry.isSettled ? "text-(--color-success)" : "text-(--color-text-muted)"
                }`}
              >
                {entry.isSettled ? "Settled" : "Mark settled"}
              </button>
            </div>
          ))}
        </div>
        <div className="neu-raised hidden overflow-x-auto md:block">
          <table className="w-full min-w-[640px] text-left text-sm">
            <thead className="text-(--color-text-muted)">
              <tr>
                <th className="px-6 py-4">Name</th>
                <th className="px-6 py-4">Amount</th>
                <th className="px-6 py-4">Date</th>
                <th className="px-6 py-4">Reason</th>
                <th className="px-6 py-4">Settled</th>
              </tr>
            </thead>
            <tbody>
              {entries?.map((entry) => (
                <tr key={entry.id} className="border-t border-white/5">
                  <td className="px-6 py-3">{entry.personName}</td>
                  <td className="px-6 py-3">{Number(entry.amount).toLocaleString()}</td>
                  <td className="px-6 py-3">{new Date(entry.date).toLocaleDateString()}</td>
                  <td className="px-6 py-3 text-(--color-text-muted)">{entry.reason}</td>
                  <td className="px-6 py-3">
                    <button
                      onClick={() => toggleSettled(entry.id, entry.isSettled)}
                      className={`focus-ring text-xs ${
                        entry.isSettled ? "text-(--color-success)" : "text-(--color-text-muted)"
                      }`}
                    >
                      {entry.isSettled ? "Settled" : "Mark settled"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </>
      )}
    </div>
  );
}