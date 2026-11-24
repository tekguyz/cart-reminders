import Stripe from "stripe";
import { BRAND } from "@/lib/brand";
import { SESSIONS_PER_HOUR } from "@/lib/caps";
import { countCapped } from "./own-session";
import { assertTestKey, buildSessionParams, paidLines, paidShipping } from "./session-params";
import { STRIPE_API_VERSION } from "./stripe-version";
import type { Checkout } from "./types";

// Stripe embedded Checkout in test mode. Server-only.

/** A minute over Stripe's 30-minute minimum, so clock drift never trips it. Leaving ends it sooner. */
const SESSION_MINUTES = 31;

export function createStripeCheckout(secretKey: string | undefined): Checkout {
  if (BRAND.demo) assertTestKey(secretKey);
  const stripe = new Stripe(secretKey!, { apiVersion: STRIPE_API_VERSION });
  return {
    kind: "stripe",
    async start(cart) {
      const s = await stripe.checkout.sessions.create(
        buildSessionParams(cart, { email: BRAND.checkoutEmail, pickupLabel: BRAND.pickupLabel, expiresAt: Math.floor(Date.now() / 1000) + SESSION_MINUTES * 60 }),
      );
      if (!s.client_secret) throw new Error("Stripe returned no client secret");
      return { sessionId: s.id, clientSecret: s.client_secret };
    },
    async expire(sessionId) {
      let s = await stripe.checkout.sessions.retrieve(sessionId);
      if (s.status === "open") s = await stripe.checkout.sessions.expire(sessionId);
      return { recoveryUrl: s.after_expiration?.recovery?.url ?? null };
    },
    async paid(sessionId) {
      const s = await stripe.checkout.sessions.retrieve(sessionId, { expand: ["shipping_cost.shipping_rate"] });
      const paid = s.payment_status === "paid";
      // The order is built from what Stripe charged, not the cart as it is now.
      const items = paid ? await stripe.checkout.sessions.listLineItems(sessionId, { limit: 100, expand: ["data.price.product"] }) : null;
      return {
        paid,
        cartId: s.metadata?.cart_id ?? null,
        amountPaid: s.amount_total ?? 0,
        lines: items ? paidLines(items.data) : null,
        shipping: paidShipping(s.shipping_cost),
      };
    },
    async countRecentSessions(sinceUnix) {
      // The account is shared with Coquimba Coffee: count only our sessions.
      return countCapped(stripe.checkout.sessions.list({ created: { gte: sinceUnix }, limit: 100 }), SESSIONS_PER_HOUR + 1);
    },
  };
}
