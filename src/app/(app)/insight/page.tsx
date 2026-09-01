"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import { NeuButton } from "@/components/NeuButton";
import { RevealOnMount } from "@/components/RevealOnMount";
import { ScrollReveal } from "@/components/ScrollReveal";
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
    <div className="flex flex-col gap-10">
      <section>
        <p className="eyebrow">01 - Gemini insight</p>
        <h1 className="mt-4 font-(family-name:--font-display) text-4xl italic text-(--color-text-primary) sm:text-5xl">
          Ask the ledger.
        </h1>
      </section>

      <RevealOnMount>
        <section className="neu-raised p-6 sm:p-10">
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
            <>
              <div className="hairline my-6 max-w-xs" />
              <p className="whitespace-pre-wrap text-(--color-text-primary)">{latest.responseText}</p>
            </>
          )}
        </section>
      </RevealOnMount>

      {history && history.length > 1 && (
        <ScrollReveal className="flex flex-col gap-4" stagger>
          <p className="eyebrow">02 - History</p>
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
        </ScrollReveal>
      )}
    </div>
  );
}