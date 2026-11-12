import { beforeEach, describe, expect, it } from "vitest";
import { createFakeCheckout, type FakeCheckout } from "@/lib/checkout/fake";
import { createFakeAdmin, createFakeShop } from "@/lib/shopify/fake";
import type { Shop, ShopAdmin } from "@/lib/shopify/types";
import { SESSIONS_PER_HOUR } from "@/lib/caps";
import { SAMPLE_HISTORY } from "../sample-history";
import { ownerNumbers } from "../owner";
import { createService, type Service } from "../service";

const IP = "203.0.113.9";
let shop: Shop, admin: ShopAdmin, checkout: FakeCheckout, svc: Service, variant: string;

beforeEach(async () => {
  shop = createFakeShop();
  admin = createFakeAdmin();
  checkout = createFakeCheckout();
  svc = createService({ shop, admin, checkout, secret: "s3cret" });
  variant = (await shop.listProducts())[0].variants[0].id;
});

function ok<T extends object>(r: T): Exclude<T, { error: string }> {
  if ("error" in r) throw new Error(String(r.error));
  return r as Exclude<T, { error: string }>;
}

async function leftCart() {
  const v = await svc.addToCart(null, variant, 1, IP);
  const started = await svc.startCheckout(v.cart.id, IP);
  if ("error" in started) throw new Error(started.error);
  const left = ok(await svc.leaveCheckout(v.cart.id, IP));
  return { cartId: v.cart.id, sessionId: started.sessionId, left };
}

describe("demo service", () => {
  it("makes a cart on the first add and reuses it after", async () => {
    const a = await svc.addToCart(null, variant, 1, IP);
    const b = await svc.addToCart(a.cart.id, variant, 1, IP);
    expect(b.cart.id).toBe(a.cart.id);
    expect(b.cart.lines[0].quantity).toBe(2);
  });

  it("starts a fresh cart when the old one is paid or gone", async () => {
    expect((await svc.addToCart("gone", variant, 1, IP)).cart.id).not.toBe("gone");
    const { cartId, sessionId } = await leftCart();
    await svc.startCheckout(cartId, IP);
    checkout.pay(sessionId);
  });

  it("leaving then skipping ahead sends the first reminder with a signed link", async () => {
    const { cartId, left } = await leftCart();
    expect(left.state.status).toBe("left");
    expect(left.token).toBeTruthy();
    const one = ok(await svc.skip(cartId, IP));
    expect(one.state.status).toBe("reminded-1");
    expect((await svc.restore(one.token!, IP))?.cart.id).toBe(cartId);
  });

  it("a forged reminder link restores nothing", async () => {
    expect(await svc.restore("abc.def", IP)).toBeNull();
  });

  it("coming back after a reminder and paying is won back, with one Shopify order", async () => {
    const { cartId } = await leftCart();
    await svc.skip(cartId, IP);
    const again = await svc.startCheckout(cartId, IP);
    if ("error" in again) throw new Error(again.error);
    checkout.pay(again.sessionId);
    const first = await svc.completeOrder(again.sessionId, IP);
    const second = await svc.completeOrder(again.sessionId, IP);
    expect(first).toMatchObject({ state: { status: "paid", wonBack: true } });
    expect(second).toMatchObject({ state: { orderName: (first as { state: { orderName: string } }).state.orderName } });
    expect(await admin.countRecentDemoOrders(new Date(0).toISOString())).toBe(1);
    const { owner } = await svc.loadCarts([cartId], IP);
    expect(owner.wonBack).toBe(ownerNumbers(SAMPLE_HISTORY, []).wonBack + 1);
  });

  it("refuses to complete an unpaid session", async () => {
    const { sessionId } = await leftCart();
    expect(await svc.completeOrder(sessionId, IP)).toEqual({ error: "not-paid" });
  });

  it("says busy past the hourly checkout cap", async () => {
    const v = await svc.addToCart(null, variant, 1, IP);
    for (let i = 0; i < SESSIONS_PER_HOUR; i++) await checkout.start(v.cart);
    expect(await svc.startCheckout(v.cart.id, IP)).toEqual({ error: "busy" });
  });

  it("refuses checkout for an empty cart", async () => {
    const v = await svc.addToCart(null, variant, 1, IP);
    await svc.changeQty(v.cart.id, v.cart.lines[0].id, 0, IP);
    expect(await svc.startCheckout(v.cart.id, IP)).toEqual({ error: "empty" });
  });

  it("loads only the carts it is given, and skips missing ones", async () => {
    const a = await svc.addToCart(null, variant, 1, IP);
    const { carts } = await svc.loadCarts([a.cart.id, "missing"], IP);
    expect(carts.map((c) => c.cart.id)).toEqual([a.cart.id]);
  });
});
