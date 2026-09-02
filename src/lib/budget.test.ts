import { describe, expect, it } from "vitest";
import {
  computeBudgetHealthGrade,
  computeGroupBalance,
  computeOverallRemaining,
  computeRolloverAmount,
  computeUnallocatedIncome,
} from "@/lib/budget";

describe("computeGroupBalance", () => {
  it("returns remaining balance and not-over-cap when spend is under cap", () => {
    expect(computeGroupBalance(500, 200)).toEqual({
      cap: 500,
      spent: 200,
      remaining: 300,
      isOverCap: false,
      overageAmount: 0,
    });
  });

  it("flags over-cap and computes overage when spend exceeds cap", () => {
    expect(computeGroupBalance(500, 650)).toEqual({
      cap: 500,
      spent: 650,
      remaining: -150,
      isOverCap: true,
      overageAmount: 150,
    });
  });

  it("treats spend exactly equal to cap as not over", () => {
    expect(computeGroupBalance(500, 500)).toEqual({
      cap: 500,
      spent: 500,
      remaining: 0,
      isOverCap: false,
      overageAmount: 0,
    });
  });

  it("handles zero cap and zero spend", () => {
    expect(computeGroupBalance(0, 0)).toEqual({
      cap: 0,
      spent: 0,
      remaining: 0,
      isOverCap: false,
      overageAmount: 0,
    });
  });
});

describe("computeOverallRemaining", () => {
  it("subtracts total spent from monthly income", () => {
    expect(computeOverallRemaining(3000, 1200)).toBe(1800);
  });

  it("allows a negative result when spend exceeds income", () => {
    expect(computeOverallRemaining(1000, 1500)).toBe(-500);
  });
});

describe("computeUnallocatedIncome", () => {
  it("subtracts total group caps from monthly income", () => {
    expect(computeUnallocatedIncome(3000, 2500)).toBe(500);
  });

  it("allows a negative result when caps exceed income (over-allocated)", () => {
    expect(computeUnallocatedIncome(1000, 1200)).toBe(-200);
  });
});

describe("computeRolloverAmount", () => {
  it("carries forward the unspent surplus", () => {
    expect(computeRolloverAmount(500, 300)).toBe(200);
  });

  it("never carries a negative amount when last month went over cap", () => {
    expect(computeRolloverAmount(500, 700)).toBe(0);
  });

  it("is zero when spend exactly matched the cap", () => {
    expect(computeRolloverAmount(500, 500)).toBe(0);
  });
});

describe("computeBudgetHealthGrade", () => {
  it("grades A for zero overage frequency", () => {
    expect(computeBudgetHealthGrade(0)).toBe("A");
  });

  it("grades B within the low-overage band", () => {
    expect(computeBudgetHealthGrade(0.15)).toBe("B");
  });

  it("grades C within the moderate-overage band", () => {
    expect(computeBudgetHealthGrade(0.35)).toBe("C");
  });

  it("grades D within the high-overage band", () => {
    expect(computeBudgetHealthGrade(0.6)).toBe("D");
  });

  it("grades F above the high-overage band", () => {
    expect(computeBudgetHealthGrade(0.61)).toBe("F");
  });
});