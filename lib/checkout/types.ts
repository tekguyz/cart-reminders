import type { Cart, PaidOrder } from "@/lib/shopify/types";

// Checkout sits behind one switch (the brand's `checkout` kind). The demo is
// Stripe's embedded Checkout; a real store would use Shopify's own checkout.

export type StartedCheckout = { sessionId: string; clientSecret: string };

export type PaidCheckout = PaidOrder & { paid: boolean; cartId: string | null };

export interface Checkout {
  kind: "stripe" | "fake";
  start(cart: Cart): Promise<StartedCheckout>;
  /** Ends a checkout the shopper left. Returns Stripe's own recovery link when it made one. */
  expire(sessionId: string): Promise<{ recoveryUrl: string | null }>;
  paid(sessionId: string): Promise<PaidCheckout>;
  countRecentSessions(sinceUnix: number): Promise<number>;
}
