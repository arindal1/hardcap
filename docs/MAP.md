# HardCap - Codebase Map

Quick index of where things live. See [ARCHITECTURE.md](ARCHITECTURE.md) for how they interact, [API.md](API.md) for endpoint contracts, [DATABASE.md](DATABASE.md) for schema.

```
prisma/schema.prisma          Data model - source of truth for the DB (see DATABASE.md)

src/middleware.ts              Route guard - redirects unauthenticated requests to /login

src/app/
  layout.tsx                   Root layout, fonts, global providers mount point
  page.tsx                     "/" - redirects to /dashboard or /login based on session
  providers.tsx                TanStack Query client provider
  globals.css                  Dark-luxury neumorphism design system (@theme, .neu-* utilities)
  login/page.tsx                Login form (Credentials + Google)
  signup/page.tsx                Signup form (Credentials)

  (app)/                        Authenticated route group, shares layout.tsx + NavBar
    layout.tsx
    dashboard/page.tsx          Overall/group balances, unallocated income, burn rate, heatmap, charts, income editor
    groups/page.tsx              Create/edit/archive budget groups, Emergency Fund toggle
    expenses/page.tsx            Rapid expense entry, table with filter/sort/inline edit
    goals/page.tsx                Goal "pots" - create, contribute/withdraw, progress
    lending/page.tsx              Lending ledger, settle toggle
    insight/page.tsx               On-demand Gemini insight + history, month-end review generator

  api/                          Route handlers - see API.md for full contract
    auth/[...nextauth]/route.ts   NextAuth v5 catch-all
    auth/signup/route.ts           Credentials signup
    me/route.ts                    GET/PATCH monthly income
    groups/route.ts                GET (list+balances) / POST (create)
    groups/[id]/route.ts            PATCH (update) / DELETE (archive)
    expenses/route.ts               GET (filtered list) / POST (create)
    expenses/[id]/route.ts           PATCH / DELETE
    goals/route.ts                    GET / POST
    goals/[id]/route.ts                PATCH / DELETE
    goals/[id]/contribute/route.ts      POST - signed deposit/withdrawal
    lending/route.ts                GET / POST
    lending/[id]/route.ts            PATCH / DELETE
    dashboard/summary/route.ts       GET aggregate dashboard payload (incl. burnRate, spendHeatmap)
    insight/route.ts                  POST - request Gemini insight (60s cooldown)
    insight/history/route.ts           GET - past insight snapshots
    month-end-review/route.ts          GET pending months / POST generate (cached per month)
    month-end-review/history/route.ts   GET past reviews

src/components/
  NavBar.tsx                    App navigation
  NeuButton.tsx / NeuInput.tsx    Neumorphic form primitives - reuse, don't recreate
  AmbientField.tsx               react-three-fiber ambient WebGL backdrop (login + dashboard only), `intensity` prop scales drift/opacity with burn rate
  RevealOnMount.tsx               GSAP entrance animation wrapper
  BurnRatePanel.tsx               Dashboard: spend % vs. time-elapsed % pace bar
  SpendingHeatmap.tsx             Dashboard: GitHub-style daily spend-intensity calendar
  NotificationCenter.tsx          Mounted in (app)/layout.tsx - derives toasts/sound/browser notifications from dashboard summary data, in-tab only
  charts/
    SpendVsBudgetChart.tsx         Recharts - spend vs. cap per group
    SpendOverTimeChart.tsx          Recharts - cumulative daily spend
    OverallBalanceTrendChart.tsx     Recharts - overall remaining balance over time

src/lib/
  db.ts                         Prisma client singleton
  auth.ts                       NextAuth v5 config (providers, callbacks, session strategy)
  budget.ts                     Pure balance/burn-rate/heatmap/Emergency Fund math - no framework/DB imports, unit-test target
  schemas.ts                     All Zod input schemas, one per endpoint payload
  gemini.ts                      Server-only Gemini REST client (insight + month-end review prompts)
  types.ts                        Shared client-side types (e.g. GroupWithBalance, DashboardSummary, Goal)
  api-client.ts                   Typed fetch wrapper - components must go through this, not raw fetch
  queries.ts                      TanStack Query hooks (useGroups, useExpenses, useGoals, etc.) - components call these
  services/
    groups.ts                     Group CRUD, live balance computation, unallocated income, Emergency Fund overage absorption
    expenses.ts                    Expense CRUD, filtering, ownership checks
    lending.ts                     Lending entry CRUD, settle/unsettle
    insight.ts                     Gemini insight orchestration, 60s cooldown, snapshot persistence
    goals.ts                       Goal CRUD, signed contribute/withdraw ledger, active-goal saved total
    month-end-review.ts            On-demand cached AI month-end report generation
    analytics.ts                   Burn rate + spending heatmap live aggregation

docs/
  PRD.md                         Product requirements - source of truth for product behavior
  ARCHITECTURE.md                Layering, data flow, design decisions
  API.md                         Endpoint-by-endpoint request/response contract
  DATABASE.md                    Schema, ER diagram, table-by-table notes
  MAP.md                          This file

memorybank.md                  Running decision/session log - read before non-trivial changes
```

## Where to make a change

| I want to... | Touch |
|---|---|
| Add/change an API contract | `src/app/api/**/route.ts` + matching `src/lib/schemas.ts` entry + `docs/API.md` |
| Add/change business logic or ownership rules | `src/lib/services/*.ts` |
| Change balance/budget math | `src/lib/budget.ts` (pure, unit-testable) |
| Add a DB field/table | `prisma/schema.prisma` + migration + `docs/DATABASE.md` |
| Change how a page fetches data | `src/lib/queries.ts` (hook) - never `fetch` directly in a component |
| Change visual styling | `src/app/globals.css` `.neu-*` utilities/CSS vars - don't introduce ad-hoc styles |
| Add motion/animation | `RevealOnMount.tsx` pattern (GSAP) or Framer Motion, always with `prefers-reduced-motion` guard |