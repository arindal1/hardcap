# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.5.0]

### Added
- **Emergency Fund**: a group can be flagged `isEmergencyFund` (at most one active per user); it now automatically absorbs every other active group's overage instead of those groups showing scattered negative balances (`computeEmergencyFundBalance` in `src/lib/budget.ts`, wired in `listGroupsWithBalances`). Surfaced on the Groups page with an "EF" badge and a "drawn from overage" line.
- **Goal savings ("pots")**: new `Goal`/`GoalContribution` models and `/goals` page - money allocated to a goal is excluded from unallocated income and can't be assigned to a budget group; it carries forward across months until the goal's target is reached. Deposits/withdrawals are signed ledger entries (`contributeToGoal` in `src/lib/services/goals.ts`); reaching the target fires the existing confetti celebration.
- **Money burn rate**: `computeBurnRate` (`src/lib/budget.ts`) compares % of total budget spent vs. % of the month elapsed; shown on the dashboard via `BurnRatePanel`.
- **Spending heatmap**: GitHub-style calendar (`SpendingHeatmap` component) over the trailing ~182 days, classifying each day's spend (`none`/`light`/`normal`/`heavy`) relative to the trailing average (`classifySpendIntensity`).
- **Dynamic dashboard background**: `AmbientField`'s particle drift speed/opacity now scale with the current burn rate (`spentFraction`) instead of being constant - busier on high-spend days, calmer on light ones.
- **Month-end review**: on-demand (no scheduler exists) Gemini-generated report for a completed month, cached per `(userId, month)` in a new `MonthEndReviewSnapshot` model. Generated from the Insight page's new "Month-end review" section.
- **AI budget optimizer**: folded into the existing `/api/insight` Gemini prompt rather than a new endpoint - the response now includes a "Reallocation suggestions" Markdown section with concrete move-money suggestions between named groups when the data supports it.
- **Markdown rendering for Gemini responses**: both insight and month-end review `responseText` now render via `react-markdown` + `remark-gfm` inside a new `.prose-neu` CSS scope (`globals.css`) instead of plain preformatted text.
- **Smart notifications**: `NotificationCenter` component (mounted app-wide) raises in-app toasts, an optional browser `Notification`, and a short Web Audio chime for near-cap (90%+), over-cap, and overall-negative conditions - deduped per condition per day via `localStorage`. In-tab only; no service worker/push infrastructure yet.

### Changed
- `computeUnallocatedIncome` now takes an optional third `totalGoalSaved` argument so goal pots are excluded from unallocated income the same way group caps already were.
- `GroupWithBalance` (API + client type) gained `isEmergencyFund` and `drawnFromOverage` fields.
- `GET /api/dashboard/summary` response gained `burnRate` and `spendHeatmap` fields.
- `createGroupSchema`/`updateGroupSchema` gained an optional `isEmergencyFund` boolean.

## [0.4.0]

### Added
- **Budget rollover**: groups can opt in (`ExpenseGroup.rolloverEnabled`) to carry an unspent cap surplus into the next month instead of resetting to zero. Carried amount is `max(0, previousMonthCap - previousMonthSpent)` (`computeRolloverAmount` in `src/lib/budget.ts`) - overspending never reduces next month's cap. Computed in `listGroupsWithBalances` (`src/lib/services/groups.ts`) from the prior month's `BudgetPeriod` cap and `Expense` total; `GroupWithBalance` now also exposes `baseCap` (the raw stored cap) alongside the rollover-inflated effective `cap`.
- **Per-group color and icon**: `ExpenseGroup.color` (one of 7 curated theme-harmonic palette keys, `src/lib/group-style.ts`) and `ExpenseGroup.icon` (emoji glyph, user-selectable from a curated set) replace the single global gold accent for group cards, progress bars, and the dashboard's cap-vs-spent bar chart (`SpendVsBudgetChart`), so each group is visually distinct at a glance.
- **Budget health grade**: an A-F letter grade (`computeBudgetHealthGrade` in `src/lib/budget.ts`) derived from the fraction of past completed group-months that went over their recorded cap (`computeBudgetHealth` in `src/lib/services/groups.ts`). Shown on the dashboard between the hero balance and the groups grid.
- **Animated number counters**: dashboard hero balances (`AnimatedNumber` component) now tween from their previous to new value on change instead of snapping, respecting `prefers-reduced-motion`.
- **Month-close celebration**: a zero-dependency canvas confetti burst plus a haptic vibration pulse (`src/lib/confetti.ts`) fires once per month, client-side only, the first time the dashboard loads after a month closes under budget (`didPreviousMonthCloseUnderBudget` in `src/lib/services/groups.ts`), gated by `localStorage` so it only shows once and skipped entirely under reduced-motion.
- Unit tests for `computeRolloverAmount` and `computeBudgetHealthGrade` in `src/lib/budget.test.ts`.

### Changed
- Login and signup pages: the "What is HardCap?" blurb (added in 0.3.4) now renders below the sign-in/signup box in DOM order on every breakpoint (mobile: Heading → Box → About → Footer) instead of inline in the heading column. On desktop the heading and box are centered as a row and the box itself is wider (`lg:max-w-xl lg:p-14`, up from `max-w-sm`).
- `createGroup`/`updateGroup` (`src/lib/services/groups.ts`) now take a single data object (`{ name, budgetCap, color?, icon?, rolloverEnabled? }`) instead of positional arguments, to accommodate the new optional fields without an unwieldy parameter list.

## [0.3.4]

### Added
- Site-wide footer (`src/components/Footer.tsx`) linking to the author's GitHub (`arindal1`).
- Expanded "What is HardCap?" blurb on the login and signup pages describing the app.
- `POST /api/groups/[id]/restore` - un-archives a group (`src/lib/services/groups.ts#restoreGroup`), rejecting the restore with `409` if an active group has since taken the same name.
- `GET /api/groups?archived=1` - lists the caller's archived groups so the UI can offer a restore action.
- Groups page: "Show archived groups" panel with a Restore button per group; the create-group `409` conflict now offers a one-click "Restore archived group instead" action when the collision is with an archived group.
- `DELETE /api/groups/[id]/permanent` - hard-deletes an **already-archived** group and cascades to its `Expense`/`BudgetPeriod` rows (`deleteGroupPermanently`). Only operates on archived groups, requiring archive-then-delete as two deliberate steps. Wired to a "Delete permanently" button (with a confirm dialog) in the Groups page's archived panel.

### Changed
- Displayed currency switched from USD (`$`) to INR (`₹`) on the dashboard and groups pages (`Intl.NumberFormat("en-IN", { currency: "INR" })`).

### Fixed
- Archiving a group previously made its name permanently unusable - the `(userId, name)` unique constraint includes archived rows, and there was no way to un-archive, so users had to pick a different name forever. Restore capability above closes this gap.
- `GET /api/groups` and `GET /api/dashboard/summary` now explicitly set `export const dynamic = "force-dynamic"` so balance figures can never be served from a cached route response.
- `POST /api/insight` now logs the real Gemini failure cause server-side (`console.error`) instead of only returning a generic 502 - makes a missing/invalid `GEMINI_API_KEY` or bad model name diagnosable.

## [0.3.3]

### Fixed
- `src/middleware.ts`/`src/lib/auth.ts`: login/signup failed on every device except the one holding a stale cached session — middleware runs on the Edge runtime and imported the full `auth.ts`, which pulls in `PrismaAdapter`/`bcryptjs` (both Node-only), crashing middleware on Render for every request and breaking the CSP nonce. Split into `src/lib/auth.config.ts` (Edge-safe: session strategy, pages, jwt/session callbacks) used by middleware, and the full Node-only config in `auth.ts` (adapter, providers) used by API routes. Also added `trustHost: true` to `auth.ts` for correct origin detection behind Render's reverse proxy.


## [0.3.2]

### Fixed
- Dashboard hero balance figure could overflow/clip on narrow phones (≤375px) - the currency string is a single unbreakable token and was locked to a 60px font size below the `sm` breakpoint. Now scales from `text-4xl` on mobile.
- Mobile bottom tab bar labels ("Dashboard", "Expenses", etc.) could wrap or crowd on small phones - tightened spacing and added `truncate`/`min-w-0` guards.
- Dashboard chart tick labels (group names, dates) could overlap on narrow chart widths - reduced tick font size and thinned chart card padding on mobile.


## [0.3.1]

### Changed
- Full front-end redesign of every page/layout within the existing dark-luxury-neumorphism design constraint: editorial Fraunces typography, a numbered `.eyebrow` section-marker motif, custom gold cursor (fine-pointer only) and scrollbar, a floating pill nav on desktop and a fixed bottom tab bar on mobile, GSAP scroll-triggered reveals, magnetic-hover buttons, and a richer two-layer parallaxing WebGL particle backdrop. All existing CRUD/filter/sort/auth business logic is unchanged - this is a presentation-layer rewrite only.

### Added
- `src/components/CustomCursor.tsx`, `GrainOverlay.tsx`, `ScrollReveal.tsx`, `NeuSelect.tsx`, `MobileTopBar.tsx`.

## [0.3.0]

### Security
- `src/middleware.ts`: unauthenticated requests to `/api/**` now get a JSON `401` instead of a `307` redirect to `/login` - the redirect resolved with a `200` HTML body that broke `apiFetch`'s `response.json()` parsing.
- `src/lib/rate-limit.ts`: added a periodic sweep to evict expired keys. Previously the in-memory attempt map only pruned a key when that same key was looked up again, so an attacker cycling through distinct emails/IPs could grow it unbounded (memory-exhaustion DoS).
- `src/lib/auth.ts`: the Credentials `authorize` callback now always runs `bcrypt.compare` (against a dummy hash when no user is found) instead of short-circuiting - closes a timing side-channel that let an attacker distinguish registered emails from unregistered ones by response time.
- `src/lib/gemini.ts`: Gemini API key moved from the request URL query string to the `x-goog-api-key` header, so it can't leak into server/proxy access logs.
- `next.config.ts`: added baseline security headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) - none were previously set.
- Added per-user rate limits to `POST /api/expenses` (60/min), `POST /api/groups` (30/min), `POST /api/lending` (60/min) to bound authenticated write-spam/resource exhaustion; these endpoints previously had none.
- `src/middleware.ts`/`next.config.ts`: CSP is now nonce-based (`script-src`/`style-src` per-request `'nonce-...'`) instead of `'unsafe-inline'` - the nonce is generated per-request in middleware and forwarded via the `x-nonce` request header, which Next.js automatically applies to its own inline bootstrap scripts.
- `src/lib/rate-limit.ts`: added `getClientIp()`, preferring `x-vercel-forwarded-for` / `x-real-ip` over the client-spoofable leftmost entry of `x-forwarded-for`. Used by the signup rate limiter.
- `src/app/api/auth/signup/route.ts`: added a per-email rate limit (5/hour) alongside the existing per-IP limit to slow down email-enumeration attempts via the `409 "Email already registered"` response - full elimination of the enumeration signal would require an email-verification signup flow, which is a larger, separate change.

## [0.2.1]

### Fixed
- `src/middleware.ts`: authenticated users hitting `/login` or `/signup` are now redirected to `/dashboard` instead of seeing the auth forms again (single sign-in UX).
- `src/middleware.ts`: `/api/health` is now excluded from the auth redirect so uptime monitors and the self-ping keep-alive (`instrumentation.ts`) get a real `200`, not a `307` to `/login`.

## [0.2.0]

### Added
- Case-insensitive duplicate group-name check on rename (`PATCH /api/groups/:id`), matching the existing check on create (US2/§13 acceptance).
- Optional "When" datetime override field on the expense entry form (`src/app/(app)/expenses/page.tsx`), wired to the already-existing `spentAt` support in `createExpenseSchema`/`createExpense` (US4/§13 acceptance - previously backend-only).
- Vitest test runner (`npm run test`) with unit tests for `src/lib/budget.ts` (`computeGroupBalance`, `computeOverallRemaining`, `computeUnallocatedIncome`).
- In-memory rate limiter (`src/lib/rate-limit.ts`), applied to `POST /api/auth/signup` (5/15min per IP) and the Credentials `authorize` callback (8/10min per email) to reduce signup-spam/brute-force exposure on unauthenticated endpoints.
- README rewritten with project-specific setup instructions (env vars, Prisma migrate, scripts), replacing default `create-next-app` boilerplate.

### Verified (no change needed)
- US10/§13 "clear error state" on Gemini failure: confirmed `insight/page.tsx` already surfaces `mutation.onError` messages from `apiFetch`.

## [0.1.0]

### Added
- Initial Next.js 16 (App Router, TypeScript, Tailwind v4, Turbopack, src-dir) scaffold.
- Prisma schema (`prisma/schema.prisma`) covering User, Account/Session/VerificationToken (NextAuth), ExpenseGroup, BudgetPeriod, Expense, LendingEntry, AIInsightRequestSnapshot.
- Auth via NextAuth v5 beta: Credentials (bcrypt) + Google OAuth, JWT sessions, route-based middleware guard.
- Core lib layer: Prisma client singleton, pure budget math (`lib/budget.ts`), Zod schemas, Gemini REST integration, typed API client, shared client types.
- Service layer: groups, expenses, lending, insight (with 60s cooldown, snapshot-on-success only).
- API routes: auth (signup + NextAuth handlers), me (income), groups, expenses, lending, dashboard/summary, insight (+ history).
- Dark-luxury neumorphic design system in `globals.css` (design tokens, `.neu-raised`/`.neu-inset`/`.neu-pressable`, `prefers-reduced-motion` overrides).
- UI pages: login, signup, dashboard, groups, expenses, lending, insight - all wired to TanStack Query hooks (`lib/queries.ts`) and the neumorphic component kit (`NeuInput`, `NeuButton`, `NavBar`).
- Ambient WebGL background (`AmbientField`, react-three-fiber) and GSAP entrance motion (`RevealOnMount`), both reduced-motion aware.
- PRD-gap closure pass: `SpendVsBudgetChart`, `SpendOverTimeChart`, `OverallBalanceTrendChart` (Recharts) wired into the dashboard; inline edit UI for expenses (`PATCH /api/expenses/:id`) and budget groups (`PATCH /api/groups/:id`); expense list filter (group/date range) and client-side column sort; unallocated income now surfaced on the dashboard and groups page via `unallocatedIncome` on `GET /api/dashboard/summary`.
- SEO: root `metadata` (title template, description, keywords, canonical, `metadataBase`) plus Open Graph/Twitter card metadata in `src/app/layout.tsx`; `src/app/robots.ts` (public marketing/auth routes indexable, app routes and `/api` disallowed) and `src/app/sitemap.ts`; `src/app/manifest.ts` web app manifest.
- Custom folder-shaped `icon.svg` favicon (replaces default Next.js `favicon.ico`) matching the neumorphic gold/charcoal palette.
- Dynamic OG/Twitter share images (`src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx`) rendered via `next/og`, sharing the `HardCap`-branded layout in `src/lib/og-image.tsx`.
- App-wide custom `not-found.tsx`, `loading.tsx`, and `error.tsx` pages styled with the existing neumorphic component kit.

### Known Issues
- `npx prisma generate` intermittently fails with `ECONNRESET` while downloading Prisma engine binaries (network-level, not a code defect). Client has not yet been generated - blocks type-check/build until resolved.
- No real NeonDB `DATABASE_URL` provisioned yet; `.env.example` only has placeholders.
- No automated tests written yet (Vitest not yet installed).
- Pre-existing, unrelated to this pass: `src/app/layout.tsx` references a `LayoutProps` type that only exists once `next build`/`next dev` has generated `.next/types` (Next 16 typed routes); `NeuButton.tsx` has a Framer Motion vs. native button `onDrag` type conflict.