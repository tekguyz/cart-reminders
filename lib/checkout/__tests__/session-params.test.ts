import { describe, expect, it } from "vitest";
import type { Cart, CartLine } from "@/lib/shopify/types";
import { SHIPPING_CENTS, assertTestKey, buildSessionParams } from "../session-params";

const line = (over: Partial<CartLine>): CartLine => ({
  id: "l",
  variantId: "v",
  productTitle: "Jinotega",
  variantTitle: "12 oz · Whole bean",
  quantity: 1,
  price: 1800,
  pickupOnly: false,
  band: "#6C8290",
  drawing: "bag",
  ...over,
});
const cart = (lines: CartLine[]): Cart => ({ id: "gid://shopify/Cart/abc", lines, subtotal: 0, currency: "USD", attributes: [] });
const opts = { email: "dana.sample@coquimba.example", expiresAt: 1_900_000_000, pickupLabel: "Pickup at the roastery" };

describe("checkout session params", () => {
  it("is embedded, never redirects, recovers, and carries the cart", () => {
    const p = buildSessionParams(cart([line({})]), opts);
    expect(p).toMatchObject({ ui_mode: "embedded", redirect_on_completion: "never", mode: "payment", customer_email: opts.email, expires_at: opts.expiresAt, metadata: { cart_id: "gid://shopify/Cart/abc" } });
    expect(p.after_expiration).toEqual({ recovery: { enabled: true } });
  });

  it("takes names, quantities and prices from the cart", () => {
    const p = buildSessionParams(cart([line({ quantity: 2, price: 2000, productTitle: "Madriz", variantTitle: "12 oz · Ground" })]), opts);
    expect(p.line_items).toEqual([{ quantity: 2, price_data: { currency: "usd", unit_amount: 2000, product_data: { name: "Madriz", description: "12 oz · Ground" } } }]);
  });

  it("offers pickup and shipping for coffee only", () => {
    const names = buildSessionParams(cart([line({})]), opts).shipping_options!.map((o) => o.shipping_rate_data!.display_name);
    expect(names).toEqual(["Pickup at the roastery", "Shipping"]);
    expect(buildSessionParams(cart([line({})]), opts).shipping_options![1].shipping_rate_data!.fixed_amount!.amount).toBe(SHIPPING_CENTS);
  });

  it("offers pickup only when any item is pickup-only", () => {
    for (const lines of [[line({ pickupOnly: true })], [line({}), line({ pickupOnly: true, productTitle: "Pinolillo" })]]) {
      const names = buildSessionParams(cart(lines), opts).shipping_options!.map((o) => o.shipping_rate_data!.display_name);
      expect(names).toEqual(["Pickup at the roastery"]);
    }
  });

  it("never asks the visitor for a real address", () => {
    expect(buildSessionParams(cart([line({})]), opts).shipping_address_collection).toBeUndefined();
  });

  it("refuses an empty cart", () => {
    expect(() => buildSessionParams(cart([]), opts)).toThrow();
  });
});

describe("test keys only", () => {
  it("accepts test keys", () => {
    expect(() => assertTestKey("sk_test_abc")).not.toThrow();
    expect(() => assertTestKey("pk_test_abc")).not.toThrow();
    expect(() => assertTestKey("rk_test_abc")).not.toThrow();
  });
  it("refuses live and missing keys", () => {
    expect(() => assertTestKey("sk_live_abc")).toThrow();
    expect(() => assertTestKey("pk_live_abc")).toThrow();
    expect(() => assertTestKey(undefined)).toThrow();
  });
});
