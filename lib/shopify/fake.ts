import catalog from "@/lib/catalog/products.json";
import type { Drawing } from "@/lib/brand/marks";
import type { Attr, Cart, DemoOrder, Product, Shop, ShopAdmin } from "./types";

// An in-memory shop with the same interface as Shopify, for unit tests and
// for local work before the founder's keys exist (SHOP_MODE=fake). It is
// refused on Vercel production (lib/shopify/index.ts).

type Raw = (typeof catalog)["products"][number];

export const FAKE_PRODUCTS: Product[] = catalog.products.map((p: Raw, i) => ({
  id: `fake-product-${i + 1}`,
  handle: p.handle,
  title: p.title,
  region: p.region,
  notes: p.notes,
  pickupOnly: p.pickupOnly,
  band: p.band,
  drawing: p.drawing as Drawing,
  image: null,
  variants: p.variants.map((v, j) => ({ id: `fake-variant-${i + 1}-${j + 1}`, title: v.title, price: v.price })),
}));

type Stored = { id: string; lines: { id: string; variantId: string; quantity: number }[]; attributes: Attr[] };

export function createFakeShop(): Shop {
  const carts = new Map<string, Stored>();
  let n = 0;

  const variant = (id: string) => {
    for (const p of FAKE_PRODUCTS) {
      const v = p.variants.find((x) => x.id === id);
      if (v) return { p, v };
    }
    throw new Error(`Unknown variant ${id}`);
  };

  const view = (s: Stored): Cart => {
    const lines = s.lines.map((l) => {
      const { p, v } = variant(l.variantId);
      return { id: l.id, variantId: v.id, productTitle: p.title, variantTitle: v.title, quantity: l.quantity, price: v.price, pickupOnly: p.pickupOnly, band: p.band, drawing: p.drawing };
    });
    return { id: s.id, lines, subtotal: lines.reduce((t, l) => t + l.price * l.quantity, 0), currency: "USD", attributes: [...s.attributes] };
  };

  const must = (id: string) => {
    const c = carts.get(id);
    if (!c) throw new Error("Cart not found");
    return c;
  };

  return {
    async listProducts() {
      return FAKE_PRODUCTS;
    },
    async createCart(variantId, quantity) {
      variant(variantId);
      const id = `fake-cart-${++n}-${Math.random().toString(36).slice(2, 10)}`;
      const c: Stored = { id, lines: [{ id: `${id}-line-1`, variantId, quantity }], attributes: [] };
      carts.set(id, c);
      return view(c);
    },
    async getCart(id) {
      const c = carts.get(id);
      return c ? view(c) : null;
    },
    async addLine(cartId, variantId, quantity) {
      const c = must(cartId);
      variant(variantId);
      const line = c.lines.find((l) => l.variantId === variantId);
      if (line) line.quantity += quantity;
      else c.lines.push({ id: `${cartId}-line-${c.lines.length + 1}-${Date.now()}`, variantId, quantity });
      return view(c);
    },
    async updateLine(cartId, lineId, quantity) {
      const c = must(cartId);
      c.lines = quantity <= 0 ? c.lines.filter((l) => l.id !== lineId) : c.lines.map((l) => (l.id === lineId ? { ...l, quantity } : l));
      return view(c);
    },
    async setAttributes(cartId, attributes) {
      const c = must(cartId);
      const map = new Map(c.attributes.map((a) => [a.key, a.value]));
      for (const a of attributes) map.set(a.key, a.value);
      c.attributes = [...map].map(([key, value]) => ({ key, value }));
      return view(c);
    },
  };
}

export function createFakeAdmin(): ShopAdmin {
  const orders: { name: string; sessionId: string; at: string }[] = [];
  return {
    async createOrder(_cart, sessionId): Promise<DemoOrder> {
      const o = { name: `#${1001 + orders.length}`, sessionId, at: new Date().toISOString() };
      orders.push(o);
      return { name: o.name };
    },
    async findOrderBySession(sessionId) {
      const o = orders.find((x) => x.sessionId === sessionId);
      return o ? { name: o.name } : null;
    },
    async countRecentDemoOrders(sinceIso) {
      return orders.filter((o) => o.at >= sinceIso).length;
    },
    async deleteDemoOrdersBefore(iso) {
      const before = orders.length;
      orders.splice(0, orders.length, ...orders.filter((o) => o.at >= iso));
      return before - orders.length;
    },
  };
}
