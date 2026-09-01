# HardCap — Installation & Deployment

## Prerequisites

- Node.js 20+, npm.
- A NeonDB Postgres project (or any Postgres instance reachable over `sslmode=require`).
- A Google Cloud OAuth 2.0 client (Web application type) for Google sign-in.
- A Gemini API key ([aistudio.google.com/apikey](https://aistudio.google.com/apikey)).

## Local installation

1. Clone the repo and install dependencies:
   ```bash
   npm install
   ```
2. Copy the environment template and fill in real values:
   ```bash
   cp .env.example .env.local
   ```
   See [Environment variables](#environment-variables) below for what each value must be.
3. Generate the Prisma client and apply the schema:
   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```
   `migrate dev` requires a live `DATABASE_URL` in `.env.local` and will create the tables in `docs/DATABASE.md` on first run.
4. Start the dev server:
   ```bash
   npm run dev
   ```
   App runs at `http://localhost:3000`.

## Environment variables

All values live in `.env.local` (never committed — see `.env.example` for the template).

| Variable | Required | Notes |
|---|---|---|
| `DATABASE_URL` | Yes | NeonDB (or other Postgres) connection string, must include `?sslmode=require`. |
| `NEXTAUTH_SECRET` | Yes | Random 32+ byte secret. Generate with `openssl rand -base64 32`. Used to sign JWT sessions — rotating it invalidates all active sessions. |
| `NEXTAUTH_URL` | Yes | Full base URL of the deployment (`http://localhost:3000` locally, the production URL in prod). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Yes | From a Google Cloud OAuth 2.0 Web client. Authorized redirect URI must be `<NEXTAUTH_URL>/api/auth/callback/google`. |
| `GEMINI_API_KEY` | Yes | Server-only — never exposed to the client (see [ARCHITECTURE.md](ARCHITECTURE.md#ai-insight-flow)). Required for the `/insight` feature to function; other features work without it. |
| `GEMINI_MODEL` | No | Defaults to `gemini-2.0-flash` if unset. |
| `SELF_URL` | No | Manual override for the app self-ping keep-alive (see [Keep-alive behavior](#keep-alive-behavior)) when not deployed on Render. Not needed on Render — `RENDER_EXTERNAL_URL` is auto-injected. |

## Build & scripts

- `npm run dev` — Turbopack dev server.
- `npm run build` — production build (runs `next build`). Fails the build on TypeScript errors.
- `npm run start` — serves the production build (`next start`) — run `build` first.
- `npm run lint` — ESLint.

Run `npx prisma generate` after `npm install` in any fresh environment (including CI) — the Prisma client is generated, not committed, and imports from `@prisma/client` will fail to resolve without it.

## Deploying to production (Vercel)

Hosting target assumed to be Vercel (no vendor-lock-in code written either way — see [ARCHITECTURE.md](ARCHITECTURE.md)). Steps:

1. **Provision the database.** Create a NeonDB project, copy its pooled connection string into `DATABASE_URL`. Neon's pooled connection string works with Prisma's default connection handling on serverless.
2. **Push the repo to a Git provider** (GitHub/GitLab/Bitbucket) Vercel can import from.
3. **Import the project in Vercel**, framework preset "Next.js" (auto-detected).
4. **Set environment variables** in Vercel Project Settings → Environment Variables, for both Production and Preview: `DATABASE_URL`, `NEXTAUTH_SECRET`, `NEXTAUTH_URL` (the deployed domain, e.g. `https://your-app.vercel.app`), `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `GEMINI_API_KEY`, `GEMINI_MODEL`.
5. **Update the Google OAuth client's authorized redirect URI** to `https://<your-production-domain>/api/auth/callback/google` (and add the Preview domain too if OAuth is needed on preview deployments).
6. **Run the initial migration against the production database** before or during first deploy:
   ```bash
   DATABASE_URL="<production-url>" npx prisma migrate deploy
   ```
   Use `migrate deploy` (not `migrate dev`) for production/CI — it applies existing migrations without prompting or generating new ones.
7. **Deploy.** Vercel runs `npm install && npx prisma generate && npm run build` (add a `postinstall": "prisma generate"` script, or a Vercel Build Command override, if the client isn't regenerating automatically on deploy).
8. **Verify:** load the production URL, confirm sign-up/sign-in (both Credentials and Google), create a group, log an expense, confirm balance updates, and confirm `/insight` returns a response (validates `GEMINI_API_KEY` is correctly set).

### Subsequent deploys

- Any `prisma/schema.prisma` change needs a new migration committed (`npx prisma migrate dev --name <change>` locally) *before* pushing — `migrate deploy` only applies migrations that already exist in the `prisma/migrations/` folder, it does not generate them.
- Vercel redeploys automatically on push to the connected branch; no manual build step needed beyond ensuring the migration is applied to production first for schema changes.

## Rollback

Vercel keeps prior deployments — use "Promote to Production" on a previous deployment in the Vercel dashboard for an application-code rollback. A schema migration is not automatically rolled back with it — if a deploy included a destructive schema change, coordinate a manual reverse migration before rolling back the app code, or the reverted code may not match the (already-migrated) database shape.

## Keep-alive behavior (Render + NeonDB free tier)

Render's free tier spins a web service down after 10 seconds of idle; NeonDB's free tier suspends its compute after 5 minutes of idle (~2-3 minute cold-start on the next query after suspension). Two independent keep-alives mitigate this:

- **DB keep-alive ping.** [src/lib/db.ts](../src/lib/db.ts) starts a 5-minute `setInterval` (`SELECT 1`) singleton on module load, so Neon never sees 5 minutes of idle while the app process is running. `unref()`'d so it never keeps a script/test process alive by itself, and cached on `globalThis` (like the Prisma client singleton) to survive dev HMR.
- **App self-ping keep-alive.** [src/instrumentation.ts](../src/instrumentation.ts) starts a 10-minute self-ping against `GET /api/health` ([src/app/api/health/route.ts](../src/app/api/health/route.ts), no auth/DB dependency) on server boot, using Render's auto-injected `RENDER_EXTERNAL_URL` (or a manually set `SELF_URL` on other hosts). This keeps an already-awake Render instance from spinning down.

**Limits:** the self-ping only prevents an *already-running* instance from going idle — it cannot wake an instance that has already spun down (Render free tier has no way to self-wake once stopped; the next real user request pays the cold start). Combined, these keep-alives eliminate idle-triggered cold starts as long as the Render instance and Neon compute are both already warm; they do not eliminate the very first cold start after a genuine idle shutdown.