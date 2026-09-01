# HardCap - API Reference

All routes are Next.js App Router route handlers under `src/app/api/**`. Except `POST /api/auth/signup` and the NextAuth handlers, every route requires an authenticated session (`auth()` from `src/lib/auth.ts`) and returns `401 { error: "Unauthorized" }` if absent. All money fields are returned as JS `number` (converted from Prisma `Decimal`). Request bodies are validated with Zod (`src/lib/schemas.ts`); invalid input returns `400 { error: <zod flatten() output> }`.

## Auth

### `POST /api/auth/signup`
Public. Creates a Credentials-auth user.
- Body: `{ email: string, password: string (min 8) }` (`signupSchema`)
- `409 { error: "Email already registered" }` if email taken.
- `201 { user: { id, email } }` on success.

### `/api/auth/[...nextauth]`
NextAuth v5 catch-all (sign-in, sign-out, session, callback, CSRF, providers). Not hand-documented here - behavior is the NextAuth v5 standard contract. Providers: Credentials (email/password via `loginSchema`), Google OAuth.

## Me / income

### `GET /api/me`
Returns `{ id, email, monthlyIncome }` for the current user.

### `PATCH /api/me`
- Body: `{ monthlyIncome: number (>= 0) }` (`updateIncomeSchema`)
- Returns updated `{ id, email, monthlyIncome }`.

## Budget groups

### `GET /api/groups`
Returns `{ data: GroupWithBalance[] }` - active (non-archived) groups for the current month, each with `{ ...group, budgetCap, cap, spent, remaining, isOverCap, overageAmount }` (live-computed via `computeGroupBalance`).

### `POST /api/groups`
- Body: `{ name: string (1-60), budgetCap: number (> 0) }` (`createGroupSchema`)
- `409 { error: "Group name already exists" }` if a case-insensitive name match exists for this user.
- `201 <ExpenseGroup>` on success. Also creates a `BudgetPeriod` row for the current month.

### `PATCH /api/groups/[id]`
- Body: `{ name?: string, budgetCap?: number }` (`updateGroupSchema`, both optional)
- `404 { error: "Not found" }` if the group doesn't belong to the caller.
- If `budgetCap` changes, upserts the current month's `BudgetPeriod`.
- Returns updated `<ExpenseGroup>`.

### `DELETE /api/groups/[id]`
Archives (soft-deletes, `isArchived: true`) - does not hard-delete. `404` if not owned. `200 { success: true }`.

## Expenses

### `GET /api/expenses`
Query params (all optional, `expenseFilterSchema`): `groupId` (uuid), `from` (ISO datetime), `to` (ISO datetime). Returns `{ data: Expense[], total: number }`, each expense includes `group: { name }`, ordered by `spentAt` desc.

### `POST /api/expenses`
- Body: `{ amount: number (> 0), groupId: uuid, note?: string (max 280), spentAt?: ISO datetime }` (`createExpenseSchema`)
- `404 { error: "Group not found" }` if `groupId` doesn't resolve to an active, owned group.
- `spentAt` defaults to now if omitted. `201 <Expense>`.

### `PATCH /api/expenses/[id]`
- Body: any subset of the create fields (`updateExpenseSchema`, all optional).
- `404 { error: "Not found" }` if the expense isn't owned, or if a supplied `groupId` doesn't resolve to an active, owned group.
- Returns updated `<Expense>`.

### `DELETE /api/expenses/[id]`
`404` if not owned. `200 { success: true }`.

## Lending ledger

Independent of the budget/expense system - no balance side-effects.

### `GET /api/lending`
Returns `{ data: LendingEntry[] }`, ordered by `date` desc.

### `POST /api/lending`
- Body: `{ personName: string (1-80), amount: number (> 0), reason?: string (max 280), date: ISO datetime }` (`createLendingSchema`)
- `201 <LendingEntry>`.

### `PATCH /api/lending/[id]`
- Body: any subset (`updateLendingSchema`), plus `isSettled?: boolean`.
- Setting `isSettled: true` stamps `settledAt = now`; setting `false` clears it to `null`.
- `404` if not owned. Returns updated `<LendingEntry>`.

### `DELETE /api/lending/[id]`
`404` if not owned. `200 { success: true }`.

## Dashboard

### `GET /api/dashboard/summary`
Returns:
```json
{
  "overallRemaining": number,
  "monthlyIncome": number,
  "totalSpent": number,
  "unallocatedIncome": number,
  "groups": GroupWithBalance[]
}
```
`unallocatedIncome = monthlyIncome - sum(active group budgetCaps)`.

## AI insight

### `POST /api/insight`
- No body.
- `429 { error: "Please wait before requesting another insight." }` if the last successful insight for this user was < 60s ago.
- `502 { error: "Failed to generate insight" }` if the Gemini call fails (network/API error). No snapshot is persisted on failure.
- `201 <AIInsightRequestSnapshot>` on success - `{ id, userId, month, requestedAt, inputSummary, responseText }`. Server assembles current month's income, per-group cap/spent/remaining, overall remaining, and days left in month; sends to Gemini (`GEMINI_API_KEY`, server-only) via `src/lib/gemini.ts`; persists only on success.

### `GET /api/insight/history`
Returns `{ data: AIInsightRequestSnapshot[] }` for the current user, ordered by `requestedAt` desc. Deliberately a separate route file from `POST /api/insight` per the PRD's exact endpoint contract - do not merge.

## Error shape convention

All error responses are `{ error: string | ZodFlattenedError }` with an appropriate HTTP status: `400` (validation), `401` (no session), `404` (not found / not owned), `409` (conflict), `429` (rate limit), `502` (upstream failure).