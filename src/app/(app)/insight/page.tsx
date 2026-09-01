"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { NeuButton } from "@/components/NeuButton";
import type { InsightSnapshot } from "@/lib/types";

export default function InsightPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);

  const { data: history } = useQuery({
    queryKey: ["insight-history"],
    queryFn: () => apiFetch<{ data: InsightSnapshot[] }>("/api/insight/history").then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: () => apiFetch<InsightSnapshot>("/api/insight", { method: "POST" }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["insight-history"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const latest = history?.[0];

  return (
    <div className="flex flex-col gap-8">
      <section className="neu-raised p-5 sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <h2 className="font-(family-name:--font-display) text-2xl italic text-(--color-accent-strong)">
            Spending insight
          </h2>
          <NeuButton
            variant="accent"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full sm:w-auto"
          >
            {mutation.isPending ? "Thinking…" : "Get insight"}
          </NeuButton>
        </div>
        {error && <p className="mt-4 text-sm text-(--color-danger)">{error}</p>}
        {latest && (
          <p className="mt-6 whitespace-pre-wrap text-(--color-text-primary)">{latest.responseText}</p>
        )}
      </section>

      {history && history.length > 1 && (
        <section className="flex flex-col gap-4">
          <h3 className="text-sm text-(--color-text-secondary)">History</h3>
          {history.slice(1).map((snapshot) => (
            <div key={snapshot.id} className="neu-raised p-6">
              <p className="text-xs text-(--color-text-muted)">
                {new Date(snapshot.requestedAt).toLocaleString()}
              </p>
              <p className="mt-2 whitespace-pre-wrap text-sm text-(--color-text-secondary)">
                {snapshot.responseText}
              </p>
            </div>
          ))}
        </section>
      )}
    </div>
  );
}