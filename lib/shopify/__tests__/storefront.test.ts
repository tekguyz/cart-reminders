import { describe, expect, it, vi } from "vitest";
import { createStorefrontShop, mapCart, mapProduct } from "../storefront";

const productNode = {
  id: "gid://shopify/Product/1",
  handle: "jinotega",
  title: "Jinotega",
  featuredImage: { url: "https://cdn.shopify.com/x.png" },
  region: { value: "Jinotega" },
  notes: { value: "Washed Caturra" },
  pickupOnly: { value: "false" },
  band: { value: "#6C8290" },
  drawing: { value: "bag" },
  variants: { nodes: [{ id: "gid://shopify/ProductVariant/11", title: "12 oz · Whole bean", price: { amount: "18.0" } }] },
};

describe("storefront mapping", () => {
  it("maps a product with its metafields and cents", () => {
    expect(mapProduct(productNode)).toEqual({
      id: "gid://shopify/Product/1",
      handle: "jinotega",
      title: "Jinotega",
      region: "Jinotega",
      notes: "Washed Caturra",
      pickupOnly: false,
      band: "#6C8290",
      drawing: "bag",
      image: "https://cdn.shopify.com/x.png",
      variants: [{ id: "gid://shopify/ProductVariant/11", title: "12 oz · Whole bean", price: 1800 }],
    });
  });

  it("falls back safely when metafields are missing", () => {
    const p = mapProduct({ ...productNode, region: null, notes: null, pickupOnly: null, band: null, drawing: null, featuredImage: null });
    expect(p).toMatchObject({ region: null, notes: "", pickupOnly: false, drawing: "bag", image: null });
    expect(p.band).toMatch(/^#/);
  });

  it("maps a cart with lines and attributes", () => {
    const cart = mapCart({
      id: "gid://shopify/Cart/abc",
      cost: { subtotalAmount: { amount: "56.0", currencyCode: "USD" } },
      attributes: [{ key: "_cr_status", value: "left" }],
      lines: {
        nodes: [
          {
            id: "gid://shopify/CartLine/1",
            quantity: 2,
            merchandise: { id: "gid://shopify/ProductVariant/11", title: "12 oz · Ground", price: { amount: "20.0" }, product: { ...productNode, title: "Madriz" } },
          },
        ],
      },
    });
    expect(cart).toMatchObject({ id: "gid://shopify/Cart/abc", subtotal: 5600, currency: "USD", attributes: [{ key: "_cr_status", value: "left" }] });
    expect(cart.lines[0]).toMatchObject({ productTitle: "Madriz", variantTitle: "12 oz · Ground", quantity: 2, price: 2000 });
  });
});

describe("storefront client", () => {
  it("sends the private token and the buyer's IP on every request", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { cart: null } })));
    const shop = createStorefrontShop({ domain: "coq.myshopify.com", token: "priv", fetch: fetchMock as unknown as typeof fetch });
    await shop.getCart("gid://shopify/Cart/abc", "203.0.113.9");
    const [url, init] = fetchMock.mock.calls[0] as unknown as [string, RequestInit];
    expect(url).toBe("https://coq.myshopify.com/api/2026-10/graphql.json");
    const headers = init.headers as Record<string, string>;
    expect(headers["Shopify-Storefront-Private-Token"]).toBe("priv");
    expect(headers["Shopify-Storefront-Buyer-IP"]).toBe("203.0.113.9");
  });

  it("throws on user errors", async () => {
    const fetchMock = vi.fn(async () => new Response(JSON.stringify({ data: { cartLinesAdd: { cart: null, userErrors: [{ message: "Bad variant" }] } } })));
    const shop = createStorefrontShop({ domain: "coq.myshopify.com", token: "priv", fetch: fetchMock as unknown as typeof fetch });
    await expect(shop.addLine("c", "v", 1, "1.1.1.1")).rejects.toThrow("Bad variant");
  });
});
