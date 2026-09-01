# HardCap

Personal expense & budget tracker. Split a fixed monthly salary into hard-capped budget groups, log expenses in seconds, and see real-time remaining balance — per group and overall — with zero drift. Includes a separate lending ledger and an on-demand Gemini-powered spending insight report.

Full product spec: [docs/PRD.md](docs/PRD.md). Architecture, API, and database docs: [docs/ARCHITECTURE.md](docs/ARCHITECTURE.md), [docs/API.md](docs/API.md), [docs/DATABASE.md](docs/DATABASE.md).

## Stack

Next.js 16 (App Router, TypeScript) · Tailwind CSS v4 · NeonDB Postgres via Prisma ORM · NextAuth v5 (Credentials + Google OAuth) · Zod · TanStack Query · Gemini REST API.

## Getting started

1. Install dependencies:

   ```bash
   npm install
   ```

2. Copy `.env.example` to `.env.local` and fill in the values (NeonDB connection string, `NEXTAUTH_SECRET`, Google OAuth credentials, Gemini API key):

   ```bash
   cp .env.example .env.local
   ```

3. Generate the Prisma client and apply migrations against your NeonDB database:

   ```bash
   npx prisma generate
   npx prisma migrate dev
   ```

4. Run the development server:

   ```bash
   npm run dev
   ```

   Open [http://localhost:3000](http://localhost:3000).

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start the dev server (Turbopack) |
| `npm run build` | Production build |
| `npm run start` | Start the production server |
| `npm run lint` | Run ESLint |
| `npm run test` | Run the Vitest unit test suite |

## Deployment

Designed to run on any Node-compatible host; no vendor-specific code. Vercel is the assumed target (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)) — set the same environment variables from `.env.example` in your hosting provider's dashboard.