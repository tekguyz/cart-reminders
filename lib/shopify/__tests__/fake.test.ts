import { describe, expect, it } from "vitest";
import { createFakeAdmin, createFakeShop } from "../fake";

describe("fake shop", () => {
  it("lists the catalog and runs a cart", async () => {
    const shop = createFakeShop();
    const products = await shop.listProducts();
    expect(products.map((p) => p.handle)).toContain("pinolillo");
    const v = products[0].variants[0];
    const cart = await shop.createCart(v.id, 1, "ip");
    const more = await shop.addLine(cart.id, v.id, 2, "ip");
    expect(more.lines).toHaveLength(1);
    expect(more.lines[0].quantity).toBe(3);
    expect(more.subtotal).toBe(v.price * 3);
    const none = await shop.updateLine(cart.id, more.lines[0].id, 0, "ip");
    expect(none.lines).toHaveLength(0);
    expect(await shop.getCart("nope", "ip")).toBeNull();
  });

  it("makes one order per session", async () => {
    const shop = createFakeShop();
    const admin = createFakeAdmin();
    const [p] = await shop.listProducts();
    const cart = await shop.createCart(p.variants[0].id, 1, "ip");
    const a = await admin.createOrder(cart, "cs_1", { amountPaid: cart.subtotal, lines: null, shipping: null });
    expect(await admin.findOrderBySession("cs_1")).toEqual(a);
    expect(await admin.findOrderBySession("cs_2")).toBeNull();
    expect(await admin.countRecentDemoOrders(new Date(0).toISOString())).toBe(1);
  });
});
