import { z } from "zod";
import { GROUP_COLOR_KEYS } from "@/lib/group-style";

export const signupSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email(),
  password: z.string().min(1, "Password is required"),
});

export const updateIncomeSchema = z.object({
  monthlyIncome: z.number().nonnegative(),
});

export const createGroupSchema = z.object({
  name: z.string().trim().min(1).max(60),
  budgetCap: z.number().positive(),
  color: z.enum(GROUP_COLOR_KEYS as [string, ...string[]]).optional(),
  icon: z.string().trim().min(1).max(4).optional(),
  rolloverEnabled: z.boolean().optional(),
});

export const updateGroupSchema = z.object({
  name: z.string().trim().min(1).max(60).optional(),
  budgetCap: z.number().positive().optional(),
  color: z.enum(GROUP_COLOR_KEYS as [string, ...string[]]).optional(),
  icon: z.string().trim().min(1).max(4).optional(),
  rolloverEnabled: z.boolean().optional(),
});

export const createExpenseSchema = z.object({
  amount: z.number().positive(),
  groupId: z.string().uuid(),
  note: z.string().trim().max(280).optional(),
  spentAt: z.string().datetime().optional(),
});

export const updateExpenseSchema = z.object({
  amount: z.number().positive().optional(),
  groupId: z.string().uuid().optional(),
  note: z.string().trim().max(280).optional(),
  spentAt: z.string().datetime().optional(),
});

export const createLendingSchema = z.object({
  personName: z.string().trim().min(1).max(80),
  amount: z.number().positive(),
  reason: z.string().trim().max(280).optional(),
  date: z.string().datetime(),
});

export const updateLendingSchema = z.object({
  personName: z.string().trim().min(1).max(80).optional(),
  amount: z.number().positive().optional(),
  reason: z.string().trim().max(280).optional(),
  date: z.string().datetime().optional(),
  isSettled: z.boolean().optional(),
});

export const expenseFilterSchema = z.object({
  groupId: z.string().uuid().optional(),
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
});