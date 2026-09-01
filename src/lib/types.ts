export type GroupWithBalance = {
  id: string;
  name: string;
  cap: number;
  spent: number;
  remaining: number;
  isOverCap: boolean;
  overageAmount: number;
};

export type Expense = {
  id: string;
  amount: string | number;
  note: string | null;
  spentAt: string;
  groupId: string;
  group?: { name: string };
};

export type LendingEntry = {
  id: string;
  personName: string;
  amount: string | number;
  reason: string | null;
  date: string;
  isSettled: boolean;
  settledAt: string | null;
};

export type DashboardSummary = {
  overallRemaining: number;
  monthlyIncome: number;
  totalSpent: number;
  unallocatedIncome: number;
  groups: GroupWithBalance[];
};

export type InsightSnapshot = {
  id: string;
  month: string;
  requestedAt: string;
  responseText: string;
};