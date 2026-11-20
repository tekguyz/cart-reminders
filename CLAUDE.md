# Cart Reminders (`cart-reminders`)

## What this is

The landing page and one-click demo for TEKGUYZ Custom Web Apps offerings 1 to 3 in `tekguyz-one` `brand/solutions.md`: online ordering and cart systems, headless e-commerce, and cart abandonment. The demo plays Segovia Coffee, a made-up roaster in Miami that roasts coffee from Nicaragua. Built to `C:/Projects/claude-config/DEMO-STANDARD.md`. Tracking issue: #1. Design: `tekguyz-one` `docs/superpowers/specs/2026-11-12-cart-reminders-design.md`.

Next.js (App Router), Tailwind 4, Vitest, on Vercel. A real Shopify Partner development store and Stripe test mode (ADR 0001). Visitor state without cookies (ADR 0002).

Next.js rules: @AGENTS.md

## Commands

- `npm run test:unit` for tests. Never `npm test`.
- `npm run typecheck` runs `next typegen` first.
- `npm run lint`.
- `npm run seed:shopify` loads the catalog (`lib/catalog/products.json`) into the Shopify store in `.env.local`. Safe to rerun.
- Local work without keys: `SHOP_MODE=fake` in `.env.local`.

## Rules

- Follow `DESIGN.md` for the look. Colors and type sizes are tokens in `app/globals.css`; Tailwind's own are off. Change `DESIGN.md` first.
- The marks live once, in `lib/brand/marks.ts`. `app/icon.svg` must equal `PRODUCT_MARK_SVG` (a test checks it).
- Everything that names the store lives in `lib/brand/index.ts` (one code, two brands). Never a real business name in the demo brand; a test checks.
- Never a price, a statistic or a phone number in the words. Product prices are sample data in Shopify and are shown only inside the shop and the cart.
- TEKGUYZ appears only in the small "Built by TEKGUYZ" credit.
- Nothing is ever sent. Reminders are drawn on screen and say so.
- The demo brand runs on Stripe test keys only (`assertTestKey`).
- Every rule is a pure function in `lib/` with a test; Shopify and Stripe are reached only through `lib/shopify/` and `lib/checkout/`.
- No GET writes anything. No cookies for visitor state. No header that blocks framing.
- Secrets live in `.env.local` and Vercel, never in git. Only the Stripe publishable key is `NEXT_PUBLIC_`.
- `next`, `react`, `react-dom` and `eslint-config-next` are pinned to exact versions. Bump them together.
- Follow `C:/Projects/claude-config/README-STANDARD.md` for the README.

## Issues and labels

New work goes to GitHub Issues (`gh` CLI). Labels: `ready-for-agent`, `ready-for-human`, `bug`, `enhancement`, `documentation`, and one Model label per issue (`opus-medium`, `sonnet-high`…). How to pick it is in the global rules.
