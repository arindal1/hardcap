/**
 * Pure balance math. No framework or DB imports - must stay independently
 * unit-testable per ARCHITECTURE.md layering rule.
 */

export interface GroupBalance {
  cap: number;
  spent: number;
  remaining: number;
  isOverCap: boolean;
  overageAmount: number;
}

export function computeGroupBalance(cap: number, spent: number): GroupBalance {
  const remaining = cap - spent;
  const isOverCap = spent > cap;
  return {
    cap,
    spent,
    remaining,
    isOverCap,
    overageAmount: isOverCap ? spent - cap : 0,
  };
}

export function computeOverallRemaining(monthlyIncome: number, totalSpent: number): number {
  return monthlyIncome - totalSpent;
}

export function computeUnallocatedIncome(monthlyIncome: number, totalCaps: number): number {
  return monthlyIncome - totalCaps;
}

// Rollover only ever carries forward an unspent surplus, never a deficit -
// overspending one month must not shrink next month's cap.
export function computeRolloverAmount(previousCap: number, previousSpent: number): number {
  return Math.max(0, previousCap - previousSpent);
}

export type BudgetHealthGrade = "A" | "B" | "C" | "D" | "F";

// Grade thresholds are on the fraction of past completed group-months that
// went over cap (0 = never over, 1 = always over).
export function computeBudgetHealthGrade(overageFrequency: number): BudgetHealthGrade {
  if (overageFrequency <= 0) return "A";
  if (overageFrequency <= 0.15) return "B";
  if (overageFrequency <= 0.35) return "C";
  if (overageFrequency <= 0.6) return "D";
  return "F";
}