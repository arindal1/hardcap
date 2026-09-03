"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { DashboardSummary, Expense, Goal, GroupWithBalance, LendingEntry } from "@/lib/types";

export function useDashboardSummary() {
  return useQuery({
    queryKey: ["dashboard-summary"],
    queryFn: () => apiFetch<DashboardSummary>("/api/dashboard/summary"),
  });
}

export function useGroups() {
  return useQuery({
    queryKey: ["groups"],
    queryFn: () => apiFetch<{ data: GroupWithBalance[] }>("/api/groups").then((r) => r.data),
  });
}

export function useArchivedGroups(enabled: boolean) {
  return useQuery({
    queryKey: ["groups", "archived"],
    queryFn: () =>
      apiFetch<{ data: { id: string; name: string; budgetCap: number }[] }>("/api/groups?archived=1").then(
        (r) => r.data
      ),
    enabled,
  });
}

export interface ExpenseFilters {
  groupId?: string;
  from?: string;
  to?: string;
}

export function useExpenses(filters: ExpenseFilters = {}) {
  const params = new URLSearchParams();
  if (filters.groupId) params.set("groupId", filters.groupId);
  if (filters.from) params.set("from", filters.from);
  if (filters.to) params.set("to", filters.to);
  const query = params.toString();

  return useQuery({
    queryKey: ["expenses", filters.groupId, filters.from, filters.to],
    queryFn: () =>
      apiFetch<{ data: Expense[] }>(`/api/expenses${query ? `?${query}` : ""}`).then((r) => r.data),
  });
}

export function useLending() {
  return useQuery({
    queryKey: ["lending"],
    queryFn: () => apiFetch<{ data: LendingEntry[] }>("/api/lending").then((r) => r.data),
  });
}

export function useGoals() {
  return useQuery({
    queryKey: ["goals"],
    queryFn: () => apiFetch<{ data: Goal[] }>("/api/goals").then((r) => r.data),
  });
}