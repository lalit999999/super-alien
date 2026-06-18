<div align="center">

<img src="public/Logo.png" alt="SuperAlien logo" width="88" />

# SuperAlien

**An AI-first productivity layer for Gmail and Google Calendar that triages, summarizes, and acts on your inbox so you don't have to.** Built as a modular Next.js monolith (App Router + feature modules) on top of Postgres, Clerk, OpenAI, and Corsair's Gmail/Calendar connectors.

[![Next.js](https://img.shields.io/badge/Next.js-16.2-black?logo=next.js)](https://nextjs.org)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org)
[![Prisma](https://img.shields.io/badge/Prisma-7-2D3748?logo=prisma)](https://www.prisma.io)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-14%2B-336791?logo=postgresql)](https://www.postgresql.org)
[![Version](https://img.shields.io/badge/version-0.1.0-orange)]()
[![License](https://img.shields.io/badge/license-TBD-lightgrey)]()

<!--
  No GitHub Actions workflow exists in this repo yet. Once you add one
  (e.g. .github/workflows/ci.yml running `npm run lint` + `npm test`),
  swap the badge below in for a live CI status indicator:
  [![CI](https://github.com/lalit999999/super-alien/actions/workflows/ci.yml/badge.svg)](https://github.com/lalit999999/super-alien/actions/workflows/ci.yml)
-->

</div>

---

## Demo

<img src="public/Logo.png" width="400" alt="logo" />

**UI screenshots**


<table>
  <tr>
    <td><img src="public/dashboard.png" width="400" alt="Dashboard" /></td>
    <td><img src="public/inbox.png" width="400" alt="Inbox" /></td>
  </tr>
  <tr>
    <td><img src="public/chat.png" width="400" alt="Agent chat" /></td>
    <td><img src="public/calander.png" width="400" alt="Calendar" /></td>
  </tr>
</table>


---

## System Overview

SuperAlien is **not** a Gmail clone — it's a workflow layer that sits on top of a user's real Gmail and Google Calendar accounts (connected via OAuth through [Corsair](https://github.com/corsair-dev)) and adds AI-driven triage, summarization, drafting, and agentic actions. Each user's mailbox is synced into a local Postgres cache so the AI and UI can query it instantly instead of round-tripping to the Gmail API on every request.

The codebase is a **single Next.js application** (not a microservice mesh), but it's internally organized as **feature modules** — each with its own `controller → service → repository` layers — so individual domains (gmail, calendar, ai, agent, billing, corsair) stay isolated and swappable.

### Architecture

```mermaid
flowchart LR
    U[Browser] -->|Clerk session| APP[Next.js App Router]
    APP --> PAGES[Protected Pages\ndashboard / inbox / calendar / chat]
    APP --> API[Route Handlers\n/api/*]

    API --> CTRL[Controllers]
    CTRL --> SVC[Services\nbusiness logic]
    SVC --> REPO[Repositories]
    REPO --> PG[(PostgreSQL\nvia Prisma)]

    SVC --> AI[OpenAI\nclassify / summarize / draft]
    SVC --> CORSAIR[Corsair Client]
    CORSAIR --> GMAIL[(Gmail API)]
    CORSAIR --> GCAL[(Google Calendar API)]

    SVC --> REDIS[(Upstash Redis\nrate limiting + cache)]
    SVC --> PAY[Razorpay\nbilling + webhooks]

    GMAIL -.webhook.-> API
    GCAL -.webhook.-> API
    PAY -.webhook.-> API
```

### Tech stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Route Handlers, React Compiler enabled) |
| Language | TypeScript (strict mode) |
| UI | Tailwind CSS 4, shadcn/ui (Radix primitives), Lucide icons |
| Client state | TanStack Query (server data), Zustand (UI-only state) |
| Auth | Clerk (sessions, sign-in/sign-up — no custom auth code) |
| Database | PostgreSQL + Prisma 7 ORM |
| Cache / rate limiting | Upstash Redis |
| AI | OpenAI (classification, summarization, draft generation, agent tool-calling) |
| Email & calendar integration | Corsair (`@corsair-dev/gmail`, `@corsair-dev/googlecalendar`) — handles OAuth, token encryption, multi-tenancy |
| Billing | Razorpay (subscriptions, usage metering, webhooks) |
| Validation | Zod on every API input |
| Testing | Vitest |

### Who it's for

| Persona | What they need from SuperAlien |
|---|---|
| Overloaded knowledge worker | Fast AI triage of a noisy inbox — priority, category, and a 3-line summary before opening anything |
| Founder / exec with back-to-back meetings | An agent that can search threads, draft replies, and schedule calendar events without leaving a chat box |
| Teams paying for seats | Predictable per-user billing (Razorpay subscriptions) with usage caps enforced server-side |

### Core capabilities

- **Inbox AI**: classify (`URGENT / IMPORTANT / NORMAL / LOW`), multi-length summarization (short / medium / bullet), and tone-aware reply drafting.
- **Agent**: a tool-calling assistant that can search emails, summarize/classify, send mail, create/update/delete calendar events, trigger syncs, and schedule-and-invite in one shot.
- **Sync engine**: incremental Gmail/Calendar sync with progress and status endpoints, backed by webhook listeners for near-real-time updates.
- **Multi-tenant OAuth**: each user connects their own Gmail/Calendar via Corsair; tokens are encrypted at rest using a KEK (key-encryption key).
- **Billing**: Razorpay-based subscriptions with usage tracking and webhook-driven state sync.

---

## Prerequisites

| Requirement | Version / Notes |
|---|---|
| Node.js | 20.x or later |
| Package manager | npm (repo ships a `package-lock.json`; yarn/pnpm/bun also work per the default Next.js scripts) |
| PostgreSQL | 14+ (any host — local, Supabase, Neon, RDS) |
| Clerk account | for `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` / `CLERK_SECRET_KEY` |
| OpenAI API key | for `OPENAI_API_KEY` |
| Upstash Redis database | REST URL + token, for rate limiting and AI response caching |
| Razorpay account | Key ID/secret, a subscription plan ID, and a webhook secret |
| Corsair KEK | a random string ≥32 characters, used to encrypt stored Gmail/Calendar OAuth tokens (AES-256) |
| A public HTTPS URL for local dev | Google OAuth and Gmail/Calendar/Razorpay webhooks all need a reachable callback URL — use [ngrok](https://ngrok.com) (the repo's `next.config.ts` already allowlists `*.ngrok-free.dev` / `*.ngrok-free.app`) |

---

## Quickstart Guide

```bash
# 1. Clone and install
git clone https://github.com/lalit999999/super-alien.git
cd super-alien
npm install

# 2. Configure environment
# No .env.example ships in this repo yet — create one yourself:
cat > .env <<'EOF'
DATABASE_URL=postgresql://user:password@localhost:5432/superalien
CORSAIR_KEK=replace-with-a-random-32+-character-secret

NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_xxxxxxxxxxxx
CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxx

OPENAI_API_KEY=sk-xxxxxxxxxxxx

UPSTASH_REDIS_REST_URL=https://xxxxxxxx.upstash.io
UPSTASH_REDIS_REST_TOKEN=xxxxxxxxxxxx

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=xxxxxxxxxxxx
RAZORPAY_PLAN_ID=plan_xxxxxxxxxxxx
RAZORPAY_WEBHOOK_SECRET=xxxxxxxxxxxx

NEXT_PUBLIC_APP_URL=http://localhost:3000
EOF

# 3. Set up the database
npx prisma generate
npx prisma migrate dev

# 4. Register Corsair's Gmail/Calendar plugins (one-time)
npm run corsair:setup

# 5. Run the dev server
npm run dev
# → http://localhost:3000
```

**To actually connect a Gmail/Calendar account locally**, Google's OAuth screen needs a public callback URL. In a second terminal:

```bash
ngrok http 3000
# then set NEXT_PUBLIC_APP_URL in .env to the ngrok HTTPS URL and restart `npm run dev`
```

**Useful one-off scripts** (all run via `tsx`, defined in `package.json`):

```bash
npm run list:users                 # dump users from the DB
npm run test:corsair:emails        # sanity-check the Gmail connector
npm run test:corsair:send          # send a test email through Corsair
npm run test:corsair:events        # list calendar events through Corsair
npm run test:corsair:create-event  # create a test calendar event
```

---

## API Reference

All routes live under `src/app/api/*`, are validated with Zod, and return a consistent envelope:

```ts
{ success: true,  data: T }
{ success: false, error: string, code: string }
```

Authentication is session-based via **Clerk** — `requireAuth()` reads the signed-in user from the request's Clerk session cookie, so these endpoints are designed to be called from the SuperAlien web app itself, not as a bearer-token public API. Most also enforce per-user rate limits (`429` with `X-RateLimit-*` headers on AI endpoints).

### AI

| Method | Endpoint | Description | Request body |
|---|---|---|---|
| `POST` | `/api/ai/summarize` | Generate short/medium/bullet summaries for one email | `{ emailId }` |
| `POST` | `/api/ai/classify` | Classify a single email into a category + confidence | `{ emailId }` |
| `POST` | `/api/ai/classify/batch` | Classify up to 50 emails in one call | `{ emailIds: string[] }` |
| `POST` | `/api/ai/draft` | Generate a reply draft for an email, with tone control | `{ emailId, tone? }` |

### Gmail

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/gmail` | List synced emails (paginated) |
| `POST` | `/api/gmail` | Send an email |
| `GET` | `/api/gmail/[id]` | Fetch a single email |
| `PATCH` | `/api/gmail/[id]` | Mark an email as read |
| `POST` | `/api/gmail/[id]/archive` | Archive an email |
| `POST` | `/api/gmail/[id]/trash` | Trash an email |
| `POST` | `/api/gmail/sync` | Trigger an inbox sync |
| `GET` | `/api/gmail/important` | List AI-flagged important emails |

### Calendar

| Method | Endpoint | Description |
|---|---|---|
| `GET` / `POST` | `/api/calendar` | List events / create an event |
| `GET` / `PATCH` / `DELETE` | `/api/calendar/[id]` | Read, update, or delete an event |
| `POST` | `/api/calendar/sync` | Trigger a calendar sync |

### Agent & Chat

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/agent/chat` | Send a message to the tool-calling agent (search/summarize/send mail, manage calendar events, trigger syncs) |
| `GET` | `/api/chat/sessions` | List chat sessions |
| `POST` | `/api/chat/session` | Create a chat session |
| `GET` / `DELETE` | `/api/chat/session/[id]` | Fetch or delete a session |

### Billing

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/billing/subscribe` | Create a Razorpay subscription order |
| `POST` | `/api/billing/verify` | Verify a completed Razorpay payment |
| `POST` | `/api/billing/cancel` | Cancel the active subscription |
| `GET` | `/api/billing/usage` | Get current usage against plan limits |
| `GET` | `/api/billing/history` | Get payment history |

### Integrations (Corsair OAuth)

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/corsair/connect?plugin=gmail\|googlecalendar` | Redirects to Google's OAuth consent screen |
| `GET` | `/api/corsair/callback` | OAuth callback — exchanges code for tokens, marks the integration connected |
| `GET` | `/api/integrations` | List a user's connected integrations |
| `POST` | `/api/integrations/disconnect` | Disconnect an integration |

### Webhooks (provider-initiated, no Clerk session)

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/webhooks/gmail` | Gmail push notifications |
| `POST` | `/api/webhooks/calendar` | Google Calendar push notifications |
| `POST` | `/api/webhooks/razorpay` | Razorpay payment/subscription events (signature-verified with `RAZORPAY_WEBHOOK_SECRET`) |

> The repo also ships parallel `/api/test/*` routes (gmail, calendar, corsair, db, AI classify, webhooks) intended purely for manual local debugging — they should not be exposed in production.

---

## Testing Protocols

| Type | Command | Notes |
|---|---|---|
| Unit / integration | `npm test` | Runs the full Vitest suite (`src/__tests__/*`) — covers caching, rate limiting, validation, sync logic, log/header sanitization, and chat rendering |
| Watch mode | `npm run test:watch` | Re-runs tests on file change during development |
| Lint | `npm run lint` | ESLint with `eslint-config-next` (core-web-vitals + TypeScript rules) |
| Corsair integration checks | `npm run test:corsair:emails` / `test:corsair:send` / `test:corsair:events` / `test:corsair:create-event` | Hit the real Gmail/Calendar connector — require valid OAuth-connected credentials, not mocked |
| End-to-end | _not yet configured_ | No Playwright/Cypress setup exists in the repo; the `(protected)` route group and `/api/test/*` handlers are the closest thing to a manual E2E surface today |

Run lint + unit tests before opening a PR:

```bash
npm run lint && npm test
```

---

## Contribution & Security

### Branching & commits

This repo doesn't yet ship a `CONTRIBUTING.md`, so until one exists, follow these conventions:

- Branch off `main` using `feature/<short-description>` or `fix/<short-description>`.
- Keep PRs scoped to one feature module (see architecture rules below) — avoid cross-cutting changes.
- Prefer [Conventional Commits](https://www.conventionalcommits.org) (`feat:`, `fix:`, `chore:`, `refactor:`) for clear changelogs.

### Code style — enforced by `CLAUDE.md`

The repo's `CLAUDE.md` codifies a strict feature-module architecture that all contributions must follow:

- Route handlers stay thin: `route.ts → controller → service → repository`. No business logic in route handlers or React components.
- Only `*.repository.ts` files may import Prisma — never from services, controllers, or components.
- Every feature lives under `src/modules/<feature>/` with its own `controller / service / repository / schema / types / constants`. No global `services/` or `controllers/` folders.
- All API inputs are validated with Zod — never trust a raw request body.
- Use absolute imports (`@/modules`, `@/components`, `@/lib`) instead of relative chains.

### Bug reports

Open a [GitHub Issue](https://github.com/lalit999999/super-alien/issues) with reproduction steps, expected vs. actual behavior, and relevant logs (redact tokens/emails).

### Security

There's no `SECURITY.md` in the repo yet. In the meantime:

- Gmail/Calendar OAuth tokens are encrypted at rest using `CORSAIR_KEK` (AES-256) — never log or commit this value.
- Razorpay webhooks are signature-verified against `RAZORPAY_WEBHOOK_SECRET`; Gmail/Calendar webhooks should be similarly verified before trusting their payload.
- Report suspected vulnerabilities privately to the maintainer rather than opening a public issue — add a contact email here once you set one up.