import { describe, expect, it, vi } from "vitest";
import { createShopAdmin, orderInput, sessionTag } from "../admin";
import type { Cart } from "../types";

const cart: Cart = {
  id: "gid://shopify/Cart/abc",
  currency: "USD",
  subtotal: 5600,
  attributes: [],
  lines: [
    { id: "l1", variantId: "gid://shopify/ProductVariant/11", productTitle: "Madriz", variantTitle: "12 oz · Ground", quantity: 2, price: 2000, pickupOnly: false, band: "#8E3A2F", drawing: "bag" },
    { id: "l2", variantId: "gid://shopify/ProductVariant/22", productTitle: "Pinolillo", variantTitle: "16 oz cup", quantity: 1, price: 500, pickupOnly: true, band: "#4A5C47", drawing: "cup" },
  ],
};

describe("admin order input", () => {
  it("is a paid test order tagged demo and with the session, for the amount paid", () => {
    const { order, options } = orderInput(cart, "cs_test_123", { amountPaid: 4500, lines: null, shipping: null });
    expect(options).toEqual({ inventoryBehaviour: "BYPASS", sendReceipt: false, sendFulfillmentReceipt: false });
    expect(order.test).toBe(true);
    expect(order.financialStatus).toBe("PAID");
    expect(order.tags).toEqual(["demo", sessionTag("cs_test_123")]);
    expect(order.lineItems).toEqual([
      { variantId: "gid://shopify/ProductVariant/11", quantity: 2 },
      { variantId: "gid://shopify/ProductVariant/22", quantity: 1 },
    ]);
    expect(order.transactions[0]).toMatchObject({ kind: "SALE", status: "SUCCESS", test: true, gateway: "stripe", amountSet: { shopMoney: { amount: "45.00", currencyCode: "USD" } } });
  });

  it("uses the lines and shipping Stripe charged for", () => {
    const { order } = orderInput(cart, "cs_test_123", { amountPaid: 2600, lines: [{ variantId: "gid://shopify/ProductVariant/11", quantity: 1 }], shipping: { title: "Shipping", amount: 600 } });
    expect(order.lineItems).toEqual([{ variantId: "gid://shopify/ProductVariant/11", quantity: 1 }]);
    expect(order.shippingLines).toEqual([{ title: "Shipping", priceSet: { shopMoney: { amount: "6.00", currencyCode: "USD" } } }]);
    expect("shippingLines" in orderInput(cart, "cs_test_123", { amountPaid: 4500, lines: null, shipping: null }).order).toBe(false);
  });

  it("counts only orders Shopify really deleted", async () => {
    const fetchMock = vi.fn(async (_url: string, init: RequestInit) => {
      const { query, variables } = JSON.parse(init.body as string);
      if (query.includes("orders(")) return Response.json({ data: { orders: { nodes: [{ id: "o1", name: "#1" }, { id: "o2", name: "#2" }, { id: "o3", name: "#3" }] } } });
      if (query.includes("orderCancel")) return Response.json({ data: { orderCancel: { userErrors: [] } } });
      if (variables.id === "o1") return Response.json({ data: { orderDelete: { deletedId: "o1", userErrors: [] } } });
      if (variables.id === "o2") return Response.json({ data: { orderDelete: { deletedId: null, userErrors: [{ message: "Order cannot be deleted" }] } } });
      return new Response("boom", { status: 500 });
    });
    const admin = createShopAdmin({ domain: "coq.myshopify.com", getToken: async () => "tok", fetch: fetchMock as unknown as typeof fetch });
    expect(await admin.deleteDemoOrdersBefore("2026-01-01T00:00:00Z")).toBe(1);
  });

  it("keeps the session tag within Shopify's 40-character limit, one tag per session", () => {
    const real = "cs_test_a1Ox7yKJtVq3mD9ZbH2pRwL8sN5fEcU0gTiY6kAjXo4vQeMBnPzWdGhSlCr";
    expect(sessionTag(real).length).toBeLessThanOrEqual(40);
    expect(sessionTag(real)).toBe(sessionTag(real));
    expect(sessionTag(real)).not.toBe(sessionTag(real + "x"));
  });

  it("looks orders up by the session tag", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { orders: { nodes: [{ name: "#1001" }] } } })));
    const admin = createShopAdmin({ domain: "coq.myshopify.com", getToken: async () => "tok", fetch: fetchMock as unknown as typeof fetch });
    expect(await admin.findOrderBySession("cs_test_123")).toEqual({ name: "#1001" });
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://coq.myshopify.com/admin/api/2026-10/graphql.json");
    expect((init.headers as Record<string, string>)["X-Shopify-Access-Token"]).toBe("tok");
    expect(JSON.parse(init.body as string).variables.q).toContain(sessionTag("cs_test_123"));
  });
});
