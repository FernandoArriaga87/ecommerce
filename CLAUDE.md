# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

AuraSport is an e-commerce application for sports team jerseys built with Next.js 15 (App Router), TypeScript, Tailwind CSS v4, and shadcn/ui. The project adheres to an edgy, high-contrast visual editorial pattern inspired by modern sport/fashion interfaces.

## Commands

```bash
npm run dev      # Start development server
npm run build    # Production build
npm run start    # Run production build locally
npm run lint     # ESLint check
npx prisma db push       # Apply schema.prisma changes to DB (no migration files — schema is source of truth)
npx prisma generate      # Regenerate client (output: src/lib/generated-prisma)
npx prisma studio        # Visual DB browser
```

Schema changes are applied with `db push`, not `migrate`. The `prisma/migrations/` folder contains one-off `.sql` scripts, not Prisma migration history. If `prisma generate` fails on Windows with `EPERM ... query_engine-windows.dll.node`, stop the dev server first — the DLL is locked while Next is running.

No test suite exists yet.

## Architecture

### Data Flow

1. **Browse** → `src/app/page.tsx` (Server Component) queries Prisma with `skip`/`take`/`orderBy` from URL params (`page`, `sort`, `category`, `search`). 12 items per page. `src/lib/data.ts` is a legacy mock type/array still imported in places.
2. **Cart** → Client-side React Context (`CartProvider`) persisted to localStorage; synced to `Cart`/`CartItem` tables on login
3. **Wishlist** → `WishlistProvider` (`src/lib/wishlist-context.tsx`) mirrors cart pattern: guest items in localStorage, merged into `WishlistItem` table on `SIGNED_IN` via `onAuthStateChange`. Toggle is optimistic with revert-on-error.
4. **Checkout** → POST `/api/checkout/quick-stripe` (auth-gated) → server-side Skydropx re-quote → SERIALIZABLE transaction (stock check + decrement + Order creation with carrier/rateId) → Stripe session redirect
5. **Payment confirmation** → Stripe webhook (`/api/webhooks/stripe`) → Order status PENDING→PAID + Resend email
6. **Refund** → Admin triggers `refundOrderAction` → `stripe.refunds.create({ payment_intent, reason })` → Stripe `charge.refunded` webhook flips order to CANCELLED. Refund UI only shown for statuses PAID/SHIPPED/DELIVERED/DISPUTED.
7. **Reviews** → `createReviewAction` requires a DELIVERED order containing the product (verified-buyer check). One review per (user, product) via composite `@@unique`. `prisma.review.aggregate` on the PDP powers `aggregateRating` in JSON-LD.
8. **Auth** → Supabase Auth → webhook (`/api/webhooks/supabase`) syncs user to Prisma `User` table + welcome email

### Route Handlers vs Server Actions

- **Route Handlers** (`/api/*`): Used for Stripe checkout, Stripe webhooks, and Supabase webhooks — these must be REST endpoints because they are called by external services or require raw `Request` access.
- **Server Actions**: Used for all other data mutations (auth actions, profile updates, admin CRUD).

### Stock Management

Stock is reserved **at checkout** (not at payment) inside a `SERIALIZABLE` Prisma transaction that atomically checks and decrements variant stock. If Stripe payment expires (30 min) or fails, the webhook restores stock. This prevents overselling.

### Authentication

Supabase Auth with `@supabase/ssr` adapters for SSR compatibility. `src/middleware.ts` refreshes sessions on every request and enforces route protection:
- `/profile`, `/orders`, `/checkout` → require auth
- `/admin/*` → require auth + `ADMIN` role (checked via Supabase REST API at edge)
- `/login`, `/register` → redirect authenticated users to `/profile`

Rate limiting is applied per-route in middleware (auth: 5 req/min, checkout: 5 req/min, API: 30 req/min).

### Webhook Idempotency

`WebhookEvent` table tracks processed Stripe event IDs to prevent duplicate order/email processing.

### Observability (Sentry)

Error tracking via `@sentry/nextjs` v10. Init is split across `instrumentation.ts` (server/edge dispatcher), `instrumentation-client.ts` (browser — v10 convention, replaces `sentry.client.config.ts`), `sentry.server.config.ts`, and `sentry.edge.config.ts`. All four read DSN from env and **no-op when DSN is absent**, so local dev stays quiet. `src/lib/sentry-scrub.ts` is a shared `beforeSend` that redacts emails, auth/cookie headers, and any key matching `password|token|secret|api_key|authorization|cookie|email`. `tracesSampleRate` is `0` (errors only). `src/app/global-error.tsx` is the App Router error boundary that calls `Sentry.captureException`. `next.config.ts` is wrapped with `withSentryConfig` and tunnels through `/monitoring` to bypass ad-blockers.

## Key Files

| File | Purpose |
|------|---------|
| `src/middleware.ts` | Session refresh, auth guards, role checks, rate limiting |
| `prisma/schema.prisma` | Full data model: User, Product, Variant, Order, Cart, Address, WishlistItem, Review, WebhookEvent |
| `src/app/api/checkout/quick-stripe/route.ts` | Stripe checkout session creation + stock reservation + Skydropx re-quote (auth required) |
| `src/app/api/webhooks/stripe/route.ts` | Payment status updates + stock restoration + refund handling |
| `src/app/actions/admin.ts` | Admin CRUD incl. `refundOrderAction` (blocks refund for PENDING/CANCELLED) |
| `src/app/actions/admin-bulk.ts` | Bulk mutations (products/orders/reviews) — each call writes an `AuditLog` entry via `logAudit` |
| `src/lib/admin-utils.ts` | `requireAdminUser` + `logAudit` helpers — use these for any new admin action |
| `src/components/admin/bulk/` | `BulkSelectionProvider` + row/header checkbox + floating `BulkActionsBar` — compose over server-rendered tables |
| `src/app/actions/reviews.ts` | Review create/delete + admin visibility toggle (verified-buyer gated) |
| `src/app/actions/wishlist.ts` | Toggle + guest→user merge (`createMany({ skipDuplicates: true })`, capped at 200) |
| `src/lib/wishlist-context.tsx` | Client provider; syncs on `onAuthStateChange` |
| `src/lib/sentry-scrub.ts` | PII redaction applied in all three Sentry configs |
| `src/lib/generated-prisma/` | Prisma client output — regenerated via `prisma generate`; do not hand-edit |

## Environment Variables

```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
DATABASE_URL          # Pooled (port 6543, pgbouncer) for runtime
DIRECT_URL            # Direct (port 5432) for Prisma migrations
STRIPE_SECRET_KEY
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY
STRIPE_WEBHOOK_SECRET
SUPABASE_WEBHOOK_SECRET
RESEND_API_KEY

# Optional — Sentry (no-op if unset)
NEXT_PUBLIC_SENTRY_DSN
SENTRY_ORG            # only needed for source map upload in prod build
SENTRY_PROJECT
SENTRY_AUTH_TOKEN
```

## Styling System

- Tailwind CSS v4 (no `tailwind.config.js`; configured via CSS `@theme`).
- High-contrast, sharp "edgy" aesthetic: `rounded-none`, heavy bold/uppercase fonts, `bg-[#18181b]` for dark surfaces.
- Use `cn()` from `src/lib/utils.ts` for class merging.
- Image remote patterns: `images.unsplash.com`, `plus.unsplash.com`, Supabase CDN.

## Component Organization

```
src/components/
├── layout/      # Navbar (with top announcement bar), Footer
├── home/        # HeroBanner (edge-to-edge), ProductGrid
├── products/    # Product specs, Size/Color selectors
├── cart/        # CartDrawer (shadcn Sheet)
├── ui/          # shadcn/ui primitives (all set to sharp/rounded-none)
```

## Rules

- En el backend usa **Server Actions** donde sea posible; Route Handlers solo para webhooks externos y endpoints que requieran acceso raw a `Request`.
- Mantén el look edgy y deportivo: sin bordes redondeados excesivos, alto contraste, tipografía bold/uppercase.
- `page.tsx` files are Server Components that fetch data directly; avoid adding `"use client"` to page files.
- After any mutation that affects a listing page, call `revalidatePath` on the relevant route inside the server action.
- Guest-accessible client state (cart, wishlist) must: (a) persist to localStorage under a `deportivo-*` key, (b) merge into the DB via an `onAuthStateChange` `SIGNED_IN` listener, (c) clear on `SIGNED_OUT`. Mirror the `CartProvider` / `WishlistProvider` shape instead of inventing a new one.
- Review creation MUST verify a DELIVERED order containing the product — do not relax this check for "easier testing". Use the seeded admin to manually mark an order DELIVERED if you need to test the flow.
- Admin bulk actions must (a) use `requireAdminUser()` instead of reimplementing the check, (b) sanitize/cap input IDs (see `sanitizeIds` in `admin-bulk.ts`, MAX=200), (c) write an `AuditLog` entry via `logAudit`. Destructive operations in the UI must confirm via `confirm()` before firing.
