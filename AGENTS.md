# Galeria — project instructions

Fullstack photo gallery + digital store for one photographer. Deploy target: HostGator VPS, Nginx + systemd, Brazil.

## Commands

~~~bash
pnpm dev
pnpm build
pnpm typecheck
pnpm check:boundaries
pnpm test
pnpm db:init
pnpm db:seed
pnpm db:admin
pnpm db:clear-orders
pnpm db:status
~~~

Stop pnpm dev before DB scripts. PGlite is single-process.

## Stack

Next.js 16 App Router, React 19, TypeScript strict, Tailwind 4, Radix primitives, PostgreSQL 17 + Drizzle, PGlite dev, sharp, Mercado Pago Checkout API/Bricks, Resend, S3/R2, Nginx + systemd.

## Structure

~~~text
src/app          routes only
src/features     domain modules (admin, auth, collections, contact, orders, payments, photos, store)
src/components   shared UI (layout, shared, ui)
src/server       shared server infra (env, email, storage, http, rate-limit)
src/lib          isomorphic helpers (money, slug, utils, validation)
src/db           Drizzle schema + client
~~~

Rules: app -> features -> lib/server/db. Features do not import app. Client code never imports server/db. See docs/ARCHITECTURE.md.

## Invariants

- Money is always read from the DB. Never trust a client amount.
- Card data never reaches the server. The Mercado Pago Brick tokenizes it.
- Do not log payment tokens, card data, or download tokens.
- Order access uses the HMAC token in src/features/orders/server/order-token.ts; never expose an order by UUID alone.
- Verify Mercado Pago webhook signature and amount before fulfilling.
- Fulfillment and refunds must stay idempotent.
- Originals and masters are private. Only /media derivatives are public.
- RAW is archived, not decoded. Do not add libraw/full RAW decode without a product decision.
- Admin auth is single-user. Keep scrypt hashing, TOTP, SameSite cookies, and origin checks.
- Do not weaken rate limits, upload validation, or signed-download limits.
- Generate migrations with pnpm db:generate; never edit an applied migration.
- PGlite is dev-only. Production uses Postgres.
- Never deploy .env.local; production uses /srv/galeria/.env.
- Keep the design tokens in src/app/globals.css; no themed UI kit.

## Payments

- /api/checkout creates an order and returns /checkout/pay/<hmac-token>.
- /api/payments creates/reuses Pix/boleto, or charges a card token.
- /api/payments/status polls and reconciles with Mercado Pago.
- Webhook: /api/webhooks/mercadopago.
- PAYMENTS_MOCK=true only works outside production and only drives the simulated panel.
- Real mode needs MP_ACCESS_TOKEN, MP_PUBLIC_KEY, MP_WEBHOOK_SECRET.

## Design

Warm-stone editorial gallery. Background #E9E5DF, ink #1C1B19, Fraunces uppercase display, Geist body. Asymmetric collage hero, masonry selection, serif caps, light footer, text links, square controls, 1px hairlines, no shadows or gradients. Primary reference: dosmasenlamesa.com/weddingphotography. Photo-first, mobile-first.

## Before changing code

1. Read the files the change touches.
2. Check callers and tests.
3. Prefer the smallest complete change.
4. Run pnpm typecheck, pnpm check:boundaries, pnpm test, pnpm build.
5. For payment/auth/upload changes, test the failure path too.

## Known limits

- One photo per order.
- Image processing is synchronous.
- In-memory rate limit; single instance.
- Cloudflare free/pro caps uploads at 100 MB.
- Real Mercado Pago/R2/Resend calls need credentials and sandbox tests.
