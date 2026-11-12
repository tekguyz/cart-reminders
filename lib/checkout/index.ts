import "server-only";
import { fakeMode } from "@/lib/shopify";
import { createFakeCheckout, type FakeCheckout } from "./fake";
import { createStripeCheckout } from "./stripe";
import type { Checkout } from "./types";

const g = globalThis as unknown as { __checkout?: Checkout };

export function getCheckout(): Checkout {
  if (g.__checkout) return g.__checkout;
  return (g.__checkout = fakeMode() ? createFakeCheckout() : createStripeCheckout(process.env.STRIPE_SECRET_KEY));
}

export function asFake(c: Checkout): FakeCheckout | null {
  return c.kind === "fake" ? (c as FakeCheckout) : null;
}

export type { Checkout, PaidCheckout, StartedCheckout } from "./types";
