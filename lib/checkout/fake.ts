import type { Checkout } from "./types";

// A stand-in for Stripe while the founder's keys don't exist (SHOP_MODE=fake).
// The demo shows a "Pay with the test card" button instead of Stripe's form.

export type FakeCheckout = Checkout & { pay(sessionId: string): void };

export function createFakeCheckout(): FakeCheckout {
  const sessions = new Map<string, { cartId: string; amount: number; paid: boolean; expired: boolean; at: number }>();
  let n = 0;
  return {
    kind: "fake",
    async start(cart) {
      const id = `cs_fake_${++n}_${Math.random().toString(36).slice(2, 8)}`;
      sessions.set(id, { cartId: cart.id, amount: cart.subtotal, paid: false, expired: false, at: Math.floor(Date.now() / 1000) });
      return { sessionId: id, clientSecret: `${id}_secret` };
    },
    async expire(sessionId) {
      const s = sessions.get(sessionId);
      if (s) s.expired = true;
      return { recoveryUrl: null };
    },
    async paid(sessionId) {
      const s = sessions.get(sessionId);
      return { paid: !!s?.paid, cartId: s?.cartId ?? null, amountPaid: s?.amount ?? 0 };
    },
    async countRecentSessions(sinceUnix) {
      return [...sessions.values()].filter((s) => s.at >= sinceUnix).length;
    },
    pay(sessionId) {
      const s = sessions.get(sessionId);
      if (s && !s.expired) s.paid = true;
    },
  };
}
