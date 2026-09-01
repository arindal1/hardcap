# Changelog

All notable changes to this project are documented here. Format based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

## [0.3.1]

### Changed
- Full front-end redesign of every page/layout within the existing dark-luxury-neumorphism design constraint: editorial Fraunces typography, a numbered `.eyebrow` section-marker motif, custom gold cursor (fine-pointer only) and scrollbar, a floating pill nav on desktop and a fixed bottom tab bar on mobile, GSAP scroll-triggered reveals, magnetic-hover buttons, and a richer two-layer parallaxing WebGL particle backdrop. All existing CRUD/filter/sort/auth business logic is unchanged — this is a presentation-layer rewrite only.

### Added
- `src/components/CustomCursor.tsx`, `GrainOverlay.tsx`, `ScrollReveal.tsx`, `NeuSelect.tsx`, `MobileTopBar.tsx`.

## [0.3.0]

### Security
- `src/middleware.ts`: unauthenticated requests to `/api/**` now get a JSON `401` instead of a `307` redirect to `/login` — the redirect resolved with a `200` HTML body that broke `apiFetch`'s `response.json()` parsing.
- `src/lib/rate-limit.ts`: added a periodic sweep to evict expired keys. Previously the in-memory attempt map only pruned a key when that same key was looked up again, so an attacker cycling through distinct emails/IPs could grow it unbounded (memory-exhaustion DoS).
- `src/lib/auth.ts`: the Credentials `authorize` callback now always runs `bcrypt.compare` (against a dummy hash when no user is found) instead of short-circuiting — closes a timing side-channel that let an attacker distinguish registered emails from unregistered ones by response time.
- `src/lib/gemini.ts`: Gemini API key moved from the request URL query string to the `x-goog-api-key` header, so it can't leak into server/proxy access logs.
- `next.config.ts`: added baseline security headers (`Content-Security-Policy`, `Strict-Transport-Security`, `X-Frame-Options`, `X-Content-Type-Options`, `Referrer-Policy`, `Permissions-Policy`) — none were previously set.
- Added per-user rate limits to `POST /api/expenses` (60/min), `POST /api/groups` (30/min), `POST /api/lending` (60/min) to bound authenticated write-spam/resource exhaustion; these endpoints previously had none.
- `src/middleware.ts`/`next.config.ts`: CSP is now nonce-based (`script-src`/`style-src` per-request `'nonce-...'`) instead of `'unsafe-inline'` — the nonce is generated per-request in middleware and forwarded via the `x-nonce` request header, which Next.js automatically applies to its own inline bootstrap scripts.
- `src/lib/rate-limit.ts`: added `getClientIp()`, preferring `x-vercel-forwarded-for` / `x-real-ip` over the client-spoofable leftmost entry of `x-forwarded-for`. Used by the signup rate limiter.
- `src/app/api/auth/signup/route.ts`: added a per-email rate limit (5/hour) alongside the existing per-IP limit to slow down email-enumeration attempts via the `409 "Email already registered"` response — full elimination of the enumeration signal would require an email-verification signup flow, which is a larger, separate change.

## [0.2.1]

### Fixed
- `src/middleware.ts`: authenticated users hitting `/login` or `/signup` are now redirected to `/dashboard` instead of seeing the auth forms again (single sign-in UX).
- `src/middleware.ts`: `/api/health` is now excluded from the auth redirect so uptime monitors and the self-ping keep-alive (`instrumentation.ts`) get a real `200`, not a `307` to `/login`.

## [0.2.0]

### Added
- Case-insensitive duplicate group-name check on rename (`PATCH /api/groups/:id`), matching the existing check on create (US2/§13 acceptance).
- Optional "When" datetime override field on the expense entry form (`src/app/(app)/expenses/page.tsx`), wired to the already-existing `spentAt` support in `createExpenseSchema`/`createExpense` (US4/§13 acceptance — previously backend-only).
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
- UI pages: login, signup, dashboard, groups, expenses, lending, insight — all wired to TanStack Query hooks (`lib/queries.ts`) and the neumorphic component kit (`NeuInput`, `NeuButton`, `NavBar`).
- Ambient WebGL background (`AmbientField`, react-three-fiber) and GSAP entrance motion (`RevealOnMount`), both reduced-motion aware.
- PRD-gap closure pass: `SpendVsBudgetChart`, `SpendOverTimeChart`, `OverallBalanceTrendChart` (Recharts) wired into the dashboard; inline edit UI for expenses (`PATCH /api/expenses/:id`) and budget groups (`PATCH /api/groups/:id`); expense list filter (group/date range) and client-side column sort; unallocated income now surfaced on the dashboard and groups page via `unallocatedIncome` on `GET /api/dashboard/summary`.
- SEO: root `metadata` (title template, description, keywords, canonical, `metadataBase`) plus Open Graph/Twitter card metadata in `src/app/layout.tsx`; `src/app/robots.ts` (public marketing/auth routes indexable, app routes and `/api` disallowed) and `src/app/sitemap.ts`; `src/app/manifest.ts` web app manifest.
- Custom folder-shaped `icon.svg` favicon (replaces default Next.js `favicon.ico`) matching the neumorphic gold/charcoal palette.
- Dynamic OG/Twitter share images (`src/app/opengraph-image.tsx`, `src/app/twitter-image.tsx`) rendered via `next/og`, sharing the `HardCap`-branded layout in `src/lib/og-image.tsx`.
- App-wide custom `not-found.tsx`, `loading.tsx`, and `error.tsx` pages styled with the existing neumorphic component kit.

### Known Issues
- `npx prisma generate` intermittently fails with `ECONNRESET` while downloading Prisma engine binaries (network-level, not a code defect). Client has not yet been generated — blocks type-check/build until resolved.
- No real NeonDB `DATABASE_URL` provisioned yet; `.env.example` only has placeholders.
- No automated tests written yet (Vitest not yet installed).
- Pre-existing, unrelated to this pass: `src/app/layout.tsx` references a `LayoutProps` type that only exists once `next build`/`next dev` has generated `.next/types` (Next 16 typed routes); `NeuButton.tsx` has a Framer Motion vs. native button `onDrag` type conflict.