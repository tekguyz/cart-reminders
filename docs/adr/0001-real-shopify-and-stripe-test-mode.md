# Real Shopify and Stripe test mode, not a browser-only demo

The other recent demos (Book Your Visit, Quote to Paid, No-Show Rescue) run only in the browser. This one is wired to a real Shopify Partner development store (products, carts, test orders through the Storefront and Admin APIs) and Stripe in test mode (embedded Checkout). The founder chose this on 2026-11-12 to learn both, and because "headless e-commerce" is only proved by a real store behind a custom front end.

Both cost nothing: a development store is free and takes only test orders; Stripe test mode charges nothing. Reminders are never sent.

## Consequences

- The demo standard's server rules apply again: no GET writes, per-hour caps (counted in Stripe and Shopify, so no database), and a daily cleanup of demo orders older than 7 days.
- Checkout is Stripe's **embedded** Checkout so the demo works inside another site's frame. Shopify's terms want a real store's sales to go through Shopify Checkout, so `checkout` in the brand file has a second kind, `shopify`, for a real store later. Only `stripe-embedded` is built.
- Shopify and Stripe each sit behind one client module with an in-memory fake (`SHOP_MODE=fake`), used by unit tests and by local work before keys exist. The fake is refused on Vercel production.
- The demo brand refuses any Stripe key that is not a test key.
