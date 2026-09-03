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

// Goal "pots" hold money that's earmarked for savings and can't be assigned
// to a group cap - subtract total saved across active goals from unallocated
// income, same idea as computeUnallocatedIncome but goal-aware.
export function computeUnallocatedIncome(
  monthlyIncome: number,
  totalCaps: number,
  totalGoalSaved = 0
): number {
  return monthlyIncome - totalCaps - totalGoalSaved;
}

export interface EmergencyFundBalance {
  cap: number;
  directSpent: number;
  drawnFromOverage: number;
  remaining: number;
  isDepleted: boolean;
}

// The Emergency Fund behaves like a normal group (it can absorb direct
// expenses logged against it) but also automatically absorbs every other
// group's overage instead of that overage showing as negative overall
// balance. Its own remaining balance can still go negative once overage
// exceeds what's left in the fund - that's the real "fund depleted" signal.
export function computeEmergencyFundBalance(
  cap: number,
  directSpent: number,
  totalOverageFromOtherGroups: number
): EmergencyFundBalance {
  const remaining = cap - directSpent - totalOverageFromOtherGroups;
  return {
    cap,
    directSpent,
    drawnFromOverage: totalOverageFromOtherGroups,
    remaining,
    isDepleted: remaining < 0,
  };
}

export interface BurnRate {
  spentFraction: number; // 0-1+, spend so far / total budget
  timeFraction: number; // 0-1, days elapsed / days in month
  pace: "ahead" | "on-track" | "behind"; // spending pace vs. time elapsed
}

// "Ahead" here means ahead of the money running out (spending faster than
// time is passing) - ahead by more than 10 percentage points counts as behind
// pace, matching feature-doc's "spent X% of budget after Y% of month" framing.
export function computeBurnRate(totalSpent: number, totalBudget: number, dayOfMonth: number, daysInMonth: number): BurnRate {
  const spentFraction = totalBudget > 0 ? totalSpent / totalBudget : 0;
  const timeFraction = daysInMonth > 0 ? dayOfMonth / daysInMonth : 0;
  const delta = spentFraction - timeFraction;
  const pace = delta > 0.1 ? "behind" : delta < -0.1 ? "ahead" : "on-track";
  return { spentFraction, timeFraction, pace };
}

export type SpendIntensity = "none" | "light" | "normal" | "heavy";

// Classifies a single day's spend relative to the user's average daily spend
// for the period, for the GitHub-style spending heatmap.
export function classifySpendIntensity(daySpend: number, averageDailySpend: number): SpendIntensity {
  if (daySpend <= 0) return "none";
  if (averageDailySpend <= 0) return "normal";
  const ratio = daySpend / averageDailySpend;
  if (ratio <= 0.5) return "light";
  if (ratio <= 1.5) return "normal";
  return "heavy";
}