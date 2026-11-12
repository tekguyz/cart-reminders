// Per-hour caps for the whole demo (DEMO-STANDARD.md rule 7). Counted in
// Stripe and Shopify themselves, so the demo needs no database. A Shopify
// development store also allows only about 5 new orders a minute.

export const SESSIONS_PER_HOUR = 60;
export const ORDERS_PER_HOUR = 30;

export function overCap(recentCount: number, cap: number): boolean {
  return recentCount >= cap;
}
