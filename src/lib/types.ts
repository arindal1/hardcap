import type { BudgetHealthGrade } from "@/lib/budget";

export type GroupWithBalance = {
  id: string;
  name: string;
  cap: number;
  baseCap: number;
  rolloverAmount: number;
  rolloverEnabled: boolean;
  color: string;
  icon: string;
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

export type BudgetHealth = {
  grade: BudgetHealthGrade;
  overageFrequency: number;
  monthsConsidered: number;
};

export type DashboardSummary = {
  overallRemaining: number;
  monthlyIncome: number;
  totalSpent: number;
  unallocatedIncome: number;
  groups: GroupWithBalance[];
  budgetHealth: BudgetHealth;
  previousMonthClosedUnderBudget: boolean | null;
};

export type InsightSnapshot = {
  id: string;
  month: string;
  requestedAt: string;
  responseText: string;
};