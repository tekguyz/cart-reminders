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
    const { order, options } = orderInput(cart, "cs_test_123", 4500);
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
