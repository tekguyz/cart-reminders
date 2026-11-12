import Stripe from "stripe";
import { BRAND } from "@/lib/brand";
import { assertTestKey, buildSessionParams } from "./session-params";
import type { Checkout } from "./types";

// Stripe embedded Checkout in test mode. Server-only.

/** Stripe's shortest allowed session life. Leaving ends it sooner. */
const SESSION_MINUTES = 30;

export function createStripeCheckout(secretKey: string | undefined): Checkout {
  if (BRAND.demo) assertTestKey(secretKey);
  const stripe = new Stripe(secretKey!);
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
      const s = await stripe.checkout.sessions.retrieve(sessionId);
      return { paid: s.payment_status === "paid", cartId: s.metadata?.cart_id ?? null, amountPaid: s.amount_total ?? 0 };
    },
    async countRecentSessions(sinceUnix) {
      let n = 0;
      for await (const session of stripe.checkout.sessions.list({ created: { gte: sinceUnix }, limit: 100 })) {
        if (session && ++n >= 500) break;
      }
      return n;
    },
  };
}
