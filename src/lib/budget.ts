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