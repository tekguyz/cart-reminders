"use server";

import { asFake, getCheckout } from "@/lib/checkout";
import { getShop } from "@/lib/shopify";
import { getService, visitorIp } from "@/lib/demo/server";

// The demo's only writes. Each is a POST (a Server Action); no GET route
// writes anything (DEMO-STANDARD.md rule 1). Inputs are IDs only: names,
// prices and quantities on the order come from Shopify.

const id = (v: unknown) => (typeof v === "string" && v.length > 0 && v.length < 300 ? v : null);
const qty = (v: unknown) => (Number.isInteger(v) ? Math.max(0, Math.min(20, v as number)) : 1);

export async function listProducts() {
  return getShop().listProducts();
}

export async function addToCart(cartId: string | null, variantId: string, quantity = 1) {
  const v = id(variantId);
  if (!v) return { error: "bad-input" as const };
  return getService().addToCart(id(cartId), v, Math.max(1, qty(quantity)), await visitorIp());
}

export async function changeQty(cartId: string, lineId: string, quantity: number) {
  const c = id(cartId), l = id(lineId);
  if (!c || !l) return { error: "bad-input" as const };
  return getService().changeQty(c, l, qty(quantity), await visitorIp());
}

export async function startCheckout(cartId: string) {
  const c = id(cartId);
  if (!c) return { error: "bad-input" as const };
  return getService().startCheckout(c, await visitorIp());
}

export async function leaveCheckout(cartId: string) {
  const c = id(cartId);
  if (!c) return { error: "bad-input" as const };
  return getService().leaveCheckout(c, await visitorIp());
}

export async function skipAhead(cartId: string) {
  const c = id(cartId);
  if (!c) return { error: "bad-input" as const };
  return getService().skip(c, await visitorIp());
}

export async function completeOrder(sessionId: string) {
  const s = id(sessionId);
  if (!s) return { error: "bad-input" as const };
  return getService().completeOrder(s, await visitorIp());
}

/** Local work only: stands in for paying with Stripe's test card. */
export async function fakePay(sessionId: string) {
  const fake = asFake(getCheckout());
  const s = id(sessionId);
  if (!fake || !s) return { error: "bad-input" as const };
  fake.pay(s);
  return getService().completeOrder(s, await visitorIp());
}

export async function loadCarts(cartIds: string[]) {
  const ids = Array.isArray(cartIds) ? cartIds.map(id).filter((x): x is string => x !== null) : [];
  return getService().loadCarts(ids, await visitorIp());
}

export async function restoreCart(token: string) {
  const t = id(token);
  return t ? getService().restore(t, await visitorIp()) : null;
}
