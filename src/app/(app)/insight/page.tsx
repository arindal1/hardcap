"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { apiFetch } from "@/lib/api-client";
import { NeuButton } from "@/components/NeuButton";
import { NeuSelect } from "@/components/NeuSelect";
import { RevealOnMount } from "@/components/RevealOnMount";
import { ScrollReveal } from "@/components/ScrollReveal";
import type { InsightSnapshot, MonthEndReviewSnapshot } from "@/lib/types";

function monthLabel(month: string) {
  return new Date(`${month}-01T00:00:00.000Z`).toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  });
}

export default function InsightPage() {
  const queryClient = useQueryClient();
  const [error, setError] = useState<string | null>(null);
  const [reviewError, setReviewError] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState("");

  const { data: history } = useQuery({
    queryKey: ["insight-history"],
    queryFn: () => apiFetch<{ data: InsightSnapshot[] }>("/api/insight/history").then((r) => r.data),
  });

  const { data: pendingMonths } = useQuery({
    queryKey: ["month-end-review-pending"],
    queryFn: () => apiFetch<{ data: string[] }>("/api/month-end-review").then((r) => r.data),
  });

  const { data: reviews } = useQuery({
    queryKey: ["month-end-reviews"],
    queryFn: () =>
      apiFetch<{ data: MonthEndReviewSnapshot[] }>("/api/month-end-review/history").then((r) => r.data),
  });

  const mutation = useMutation({
    mutationFn: () => apiFetch<InsightSnapshot>("/api/insight", { method: "POST" }),
    onSuccess: () => {
      setError(null);
      queryClient.invalidateQueries({ queryKey: ["insight-history"] });
    },
    onError: (err: Error) => setError(err.message),
  });

  const reviewMutation = useMutation({
    mutationFn: (month: string) =>
      apiFetch<MonthEndReviewSnapshot>("/api/month-end-review", {
        method: "POST",
        body: JSON.stringify({ month }),
      }),
    onSuccess: () => {
      setReviewError(null);
      queryClient.invalidateQueries({ queryKey: ["month-end-review-pending"] });
      queryClient.invalidateQueries({ queryKey: ["month-end-reviews"] });
    },
    onError: (err: Error) => setReviewError(err.message),
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
              <div className="prose-neu">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{latest.responseText}</ReactMarkdown>
              </div>
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
              <div className="prose-neu mt-2 text-sm">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{snapshot.responseText}</ReactMarkdown>
              </div>
            </div>
          ))}
        </ScrollReveal>
      )}

      <RevealOnMount>
        <section className="neu-raised p-6 sm:p-10">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="eyebrow">03 - Month-end review</p>
              <p className="mt-2 text-sm text-(--color-text-muted)">
                Generate an AI report for a completed month - cached, so it&apos;s only generated once.
              </p>
            </div>
            {pendingMonths && pendingMonths.length > 0 ? (
              <div className="flex w-full gap-3 sm:w-auto">
                <div className="min-w-[160px] flex-1 sm:flex-none">
                  <NeuSelect
                    label="Month"
                    value={selectedMonth || pendingMonths[0]}
                    onChange={(e) => setSelectedMonth(e.target.value)}
                  >
                    {pendingMonths.map((month) => (
                      <option key={month} value={month}>
                        {monthLabel(month)}
                      </option>
                    ))}
                  </NeuSelect>
                </div>
                <NeuButton
                  variant="accent"
                  onClick={() => reviewMutation.mutate(selectedMonth || pendingMonths[0])}
                  disabled={reviewMutation.isPending}
                >
                  {reviewMutation.isPending ? "Writing…" : "Generate"}
                </NeuButton>
              </div>
            ) : (
              <p className="text-xs text-(--color-text-muted)">No completed months awaiting review.</p>
            )}
          </div>
          {reviewError && <p className="mt-4 text-sm text-(--color-danger)">{reviewError}</p>}
        </section>
      </RevealOnMount>

      {reviews && reviews.length > 0 && (
        <ScrollReveal className="flex flex-col gap-4" stagger>
          {reviews.map((review) => (
            <div key={review.id} className="neu-raised p-6">
              <p className="eyebrow">{monthLabel(review.month)}</p>
              <div className="prose-neu mt-4">
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{review.responseText}</ReactMarkdown>
              </div>
            </div>
          ))}
        </ScrollReveal>
      )}
    </div>
  );
}