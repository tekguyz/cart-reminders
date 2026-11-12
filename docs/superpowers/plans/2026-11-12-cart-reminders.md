# Cart Reminders Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task (founder's choice: one build, by Claude on Opus 5.5 medium, in this session). Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** The Cart Reminders landing page and a one-click demo: Coquimba Coffee, a headless store on a Shopify development store, Stripe test-mode embedded Checkout, and simulated cart reminders with an owner panel.

**Architecture:** Next.js App Router on Vercel, modelled on `book-your-visit`. All rules are pure functions in `lib/` (demo state, schedule, owner numbers, session building, tokens, caps). Shopify and Stripe each sit behind one small client module with the same interface as an in-memory fake (`SHOP_MODE=fake`), used by unit tests and by local preview before the founder's keys exist. Visitor state: cart IDs in `localStorage`, each cart's demo state in Shopify cart attributes.

**Tech Stack:** Next.js 16 (pinned like book-your-visit), React 19, Tailwind 4, Vitest, `stripe`, `@stripe/stripe-js`, `@stripe/react-stripe-js`, `@resvg/resvg-js` + `tsx` (seed script only).

**Spec:** `tekguyz-one/docs/superpowers/specs/2026-11-12-cart-reminders-design.md`. Look: `tekguyz-one/docs/superpowers/specs/cart-reminders-mockups/a-opus.html` (v2 colors).

## Global Constraints

- App name "Cart Reminders"; store "Coquimba Coffee", Miami, Nicaraguan coffee. TEKGUYZ only in "Built by TEKGUYZ".
- No real business name (CI scan includes "Haydee", "Callejas"), no real farm names, no phone, no street address.
- No prices or statistics in the copy outside the store; product prices are sample data in the shop and cart only.
- Nothing is ever sent. Reminders are drawn and labelled "Not sent".
- Demo brand refuses any Stripe key not starting with `sk_test_` / `pk_test_`.
- Secrets server-side only; `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` is the one public key.
- No cookies for visitor state. No `X-Frame-Options`, no `frame-ancestors`.
- Demo pages `noindex`; landing indexed.
- Pin Shopify API version `2026-10` in `lib/shopify/version.ts`.
- Reminder schedule: first at 1 hour after leaving, second at 24 hours, then stop; stop at paid.
- Checkout email fixed: `dana.sample@coquimba.example`.
- Tokens from `DESIGN.md` only; Tailwind's own colors and sizes off (as book-your-visit).
- `npm run test:unit`, never `npm test`.

## Review Focus

1. A cart with only pickup-only items, or mixed: checkout must offer pickup only when any pickup-only line is in the cart. Test in Task 4.
2. "Skip ahead" pressed many times: state goes left → reminded-1 → reminded-2 and stays; never a third reminder; never reminded once paid. Test in Task 2.
3. Paying twice for the same session (webhook and `onComplete` both fire): one Shopify order only. Test in Task 5 (idempotent by session ID attribute).
4. Storage blocked (Safari private, frame): the demo still runs for one page visit with the cart ID held in memory. Test in Task 3 (`visitorStore` falls back to memory).
5. A forged or edited reminder link: refused with a plain "This link has expired" page, no cart shown. Test in Task 2 (token verify).

---

### Task 1: Scaffold, brand, tokens, guards

**Files:** `package.json`, `next.config.ts`, `tsconfig.json`, `eslint.config.mjs`, `vitest.config.mts`, `.gitignore`, `.github/workflows/ci.yml`, `.claude/launch.json`, `.env.example`, `app/globals.css`, `app/layout.tsx`, `lib/site.ts`, `lib/brand/index.ts`, `lib/brand/marks.ts`, `app/icon.svg`, `DESIGN.md`, `CLAUDE.md`, `AGENTS.md`, `CONTEXT.md`, `docs/adr/0001-real-shopify-and-stripe-test-mode.md`, `docs/adr/0002-visitor-state-without-cookies.md`, `app/__tests__/guards.test.ts`

**Interfaces:**
- Produces: `BRAND: Brand` (`name`, `appName`, `checkoutEmail`, `pickupLabel`, `colors`), `PRODUCT_MARK_SVG`, `STORE_MARK_SVG`, `bagSvg(band: string): string`, `cupSvg(band: string): string`, `SITE_URL: string`.

- [ ] Copy configs from `book-your-visit` (same pinned versions, CI, vitest, gitignore, launch.json with `autoPort`).
- [ ] Tokens in `globals.css` from mockup A v2: paper `#F4F0E8`, line `#DCD3C3`, ink `#221E1B`, muted `#6A625A`, back `#3E5747`, back-deep `#2C4134`, back-soft `#E4E7DF`, left `#A2702F`, left-soft `#F0E5D1`; shop: cream `#F4EBDC`, bone `#FBF6EE`, char `#2A2320`, cherry `#8E3A2F`, shade `#4A5C47`, gold `#B58A43`, clay `#A3684A`, sky `#6C8290`. Fonts Instrument Serif (app display), Hanken Grotesk (body), Gloock (shop).
- [ ] Guard tests: `icon.svg equals PRODUCT_MARK_SVG`; no `$`+digit or `%` in `app/page.tsx` copy; no phone pattern; no "Haydee"/"Callejas"/"TEKGUYZ" except the credit string across `app/`, `components/`, `lib/`.
- [ ] Run `npm run test:unit`, `npm run typecheck`, `npm run lint`. Commit.

### Task 2: Pure demo rules

**Files:** `lib/demo/state.ts`, `lib/demo/owner.ts`, `lib/demo/sample-history.ts`, `lib/reminder-token.ts`, `lib/caps.ts`, tests in `lib/demo/__tests__/`, `lib/__tests__/`

**Interfaces:**
- `type CartStatus = "shopping" | "left" | "reminded-1" | "reminded-2" | "paid"`
- `type DemoState = { status: CartStatus; leftAtMin: number | null; clockMin: number; sessionId: string | null; wonBack: boolean; orderName: string | null }` (minutes on the demo clock)
- `stateFromAttributes(attrs: {key: string; value: string}[]): DemoState`, `stateToAttributes(s: DemoState): {key: string; value: string}[]` (keys start with `_cr_`)
- `leave(s, sessionId): DemoState`, `skipAhead(s): DemoState` (jumps the clock to the next due reminder, applies it), `markPaid(s, orderName): DemoState` (sets `wonBack` when status was reminded-*), `nextReminderAtMin(s): number | null`, `REMINDER_HOURS = [1, 24]`
- `ownerNumbers(history: OwnerCart[], mine: OwnerCart[]): { started; left; reminded; wonBack; orders }`
- `signCartToken(cartId: string, secret: string): string`, `verifyCartToken(token: string, secret: string): string | null` (HMAC-SHA256, base64url)
- `overCap(recentCount: number, cap: number): boolean`; caps `SESSIONS_PER_HOUR = 60`, `ORDERS_PER_HOUR = 30`

- [ ] Tests: leave sets `left` and `leftAtMin = clockMin`; skipAhead twice → reminded-2, a third press changes nothing; skipAhead on paid changes nothing; markPaid after reminded-1 → `wonBack: true`; markPaid from left → `wonBack: false`; attributes round-trip; token round-trip; edited token → null; wrong secret → null; owner numbers add history and mine.
- [ ] Implement, run, commit.

### Task 3: Shop clients (Shopify Storefront, Admin, fake) and visitor store

**Files:** `lib/shopify/version.ts`, `lib/shopify/types.ts`, `lib/shopify/storefront.ts`, `lib/shopify/admin.ts`, `lib/shopify/fake.ts`, `lib/shopify/index.ts`, `lib/visitor-store.ts`, tests

**Interfaces:**
- `type Product = { id; handle; title; region: string | null; notes; pickupOnly: boolean; band: string; kind: "bag" | "cup"; image: string | null; variants: Variant[] }`, `type Variant = { id; title; price: number /* cents */ }`
- `type Cart = { id; lines: CartLine[]; subtotal: number; attributes: {key; value}[] }`, `CartLine = { id; variantId; productTitle; variantTitle; quantity; price; pickupOnly; band; kind }`
- `interface Shop { listProducts(): Promise<Product[]>; createCart(variantId, qty, buyerIp): Promise<Cart>; getCart(id, buyerIp): Promise<Cart | null>; addLine(cartId, variantId, qty, buyerIp); updateLine(cartId, lineId, qty, buyerIp); setAttributes(cartId, attrs, buyerIp): Promise<Cart> }`
- `interface ShopAdmin { createOrder(cart: Cart, sessionId: string): Promise<{ name: string }>; findOrderBySession(sessionId): Promise<{ name } | null>; countRecentDemoOrders(sinceIso): Promise<number>; deleteDemoOrdersBefore(iso): Promise<number> }`
- `getShop(): Shop`, `getShopAdmin(): ShopAdmin` pick fake when `SHOP_MODE=fake` (refused when `VERCEL_ENV === "production"`).
- `visitorStore`: `getCartIds(): string[]`, `currentCartId(): string | null`, `setCurrent(id)`, `startFresh()`; localStorage with memory fallback.
- Product metadata (region, notes, pickup-only, band, kind) comes from Shopify product metafields `coquimba.*`; the fake reads `lib/catalog/products.json`.

- [ ] Tests (fake + pure mappers): Storefront response maps to `Product`; every request sends `Shopify-Storefront-Buyer-IP`; `orderCreate` input uses `inventoryBehaviour: "BYPASS"`, `test: true`, tag `demo`, and stores the session ID; fake `findOrderBySession` dedupes; visitor store falls back to memory when `localStorage` throws.
- [ ] Admin token: client credentials grant (`SHOPIFY_CLIENT_ID`, `SHOPIFY_CLIENT_SECRET`) cached until expiry, or a fixed `SHOPIFY_ADMIN_TOKEN` when set.
- [ ] Implement, run, commit.

### Task 4: Checkout (Stripe embedded) behind one switch

**Files:** `lib/checkout/types.ts`, `lib/checkout/stripe.ts`, `lib/checkout/fake.ts`, `lib/checkout/index.ts`, `lib/checkout/session-params.ts`, tests

**Interfaces:**
- `buildSessionParams(cart: Cart, opts: { email: string; returnUrl: string; expiresAt: number }): Stripe.Checkout.SessionCreateParams` — `ui_mode: "embedded"`, `redirect_on_completion: "never"`, line items from cart prices, `customer_email`, `shipping_address_collection` only when shipping is offered, `shipping_options` pickup (0) always and shipping (sample amount) only when no pickup-only line, `after_expiration.recovery.enabled: true`, `metadata.cart_id`.
- `interface Checkout { start(cart): Promise<{ sessionId; clientSecret }>; expire(sessionId): Promise<{ recoveryUrl: string | null }>; paid(sessionId): Promise<{ paid: boolean; cartId: string }>; countRecentSessions(sinceUnix): Promise<number> }`
- `assertTestKey(key: string): void` throws unless `sk_test_` / `pk_test_`.

- [ ] Tests: pickup-only cart → only pickup option and no address collection; mixed → pickup only; coffee only → both; prices from cart, not input; `assertTestKey("sk_live_x")` throws.
- [ ] Implement, run, commit.

### Task 5: Server actions, webhook, cron

**Files:** `app/demo/actions.ts`, `app/api/stripe/webhook/route.ts`, `app/api/cron/cleanup/route.ts`, `vercel.json`, `lib/demo/service.ts`, tests for `service.ts`

**Interfaces:**
- `service.ts` (pure orchestration over `Shop`, `ShopAdmin`, `Checkout`, testable with fakes): `addToCart(cartId | null, variantId, qty, ip)`, `changeQty(cartId, lineId, qty, ip)`, `startCheckout(cartId, ip)` (cap check), `leaveCheckout(cartId, ip)` → `{ cart, state, recoveryUrl }`, `skip(cartId, ip)`, `completeOrder(sessionId, ip)` (idempotent: existing order by session → return it), `loadCarts(ids, ip)` → `{ carts, owner }`.
- Actions are thin `"use server"` wrappers that read the IP from `x-forwarded-for`.
- Webhook verifies `STRIPE_WEBHOOK_SECRET`, handles `checkout.session.completed` → `completeOrder`.
- Cron: `Authorization: Bearer ${CRON_SECRET}`, deletes demo orders older than 7 days; `vercel.json` cron daily `0 9 * * *`.

- [ ] Tests: completeOrder twice → one order; startCheckout over cap → `{ error: "busy" }`; leave then skip → reminded-1; complete after reminder → owner `wonBack` +1.
- [ ] Implement, run, commit.

### Task 6: Demo screens

**Files:** `app/demo/layout.tsx` (noindex), `app/demo/page.tsx`, `app/demo/back/[token]/page.tsx`, `components/demo/*` (`demo-app.tsx`, `banner.tsx`, `things-to-try.tsx`, `shop.tsx`, `product-card.tsx`, `cart-panel.tsx`, `checkout-panel.tsx`, `reminder.tsx`, `clock.tsx`, `owner-panel.tsx`, `timeline.tsx`), `components/bag.tsx`

- [ ] Follow mockup A frames 2 and 3: shop in a browser frame (`coquimba.example`), owner panel right from 1024px, tabs below; "Things to try" chips: Add to cart, Leave at checkout, Skip ahead to the reminder, Come back and pay, See the order.
- [ ] Checkout panel: `EmbeddedCheckoutProvider` with `onComplete` → `completeOrder`; "Leave without paying" button; hint "Use test card 4242 4242 4242 4242, any future date, any CVC."
- [ ] Reminder: email + text, "Not sent · demo", main button → `/demo/back/<token>`; small link "Stripe's own recovery page" when a recovery URL exists (new tab).
- [ ] Back page: verifies token server-side, then a client step sets the cart current and opens checkout; bad token → "This link has expired."
- [ ] Fake mode: checkout panel shows a "Pay with the test card" button instead of Stripe.
- [ ] Preview check at 390 and 1440 in fake mode; commit.

### Task 7: Landing page, link preview, icons, README

**Files:** `app/page.tsx`, `app/opengraph-image.tsx`, `app/apple-icon.tsx`, `app/robots.ts`, `app/sitemap.ts`, `app/_og/*` fonts, `README.md`, `docs/banner.svg`

- [ ] Follow mockup A frame 1 and the mark frame. Copy from the mockup ("The shopper left. The cart came back."). "Try the demo" is a plain link. Footer credit.
- [ ] README to `claude-config/README-STANDARD.md`.
- [ ] Guard tests pass; preview at 390 and 1440; commit.

### Task 8: Seed script and real wiring (needs the founder's keys)

**Files:** `lib/catalog/products.json`, `scripts/seed-shopify.ts`, `scripts/render-labels.ts`

- [ ] Labels rendered to PNG from `bagSvg`/`cupSvg` with resvg; seed creates metafield definitions, products (untracked stock), uploads images, publishes to the Headless channel; reruns update by handle.
- [ ] One-off Stripe call: embedded session with recovery, expire it, check `after_expiration.recovery.url`. Drop the link if null, and say so.
- [ ] Full flow on the preview with real test keys, at both widths and in a frame (Chrome and WebKit).
