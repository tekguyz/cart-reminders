import type { Drawing } from "@/lib/brand/marks";

// The shop as the app sees it. Shopify, and the fake, are reached only
// through these two interfaces. Money is integer cents.

export type Attr = { key: string; value: string };

export type Variant = { id: string; title: string; price: number };

export type Product = {
  id: string;
  handle: string;
  title: string;
  region: string | null;
  notes: string;
  pickupOnly: boolean;
  band: string;
  drawing: Drawing;
  image: string | null;
  variants: Variant[];
};

export type CartLine = {
  id: string;
  variantId: string;
  productTitle: string;
  variantTitle: string;
  quantity: number;
  price: number;
  pickupOnly: boolean;
  band: string;
  drawing: Drawing;
};

export type Cart = { id: string; lines: CartLine[]; subtotal: number; currency: string; attributes: Attr[] };

export interface Shop {
  listProducts(): Promise<Product[]>;
  createCart(variantId: string, quantity: number, buyerIp: string): Promise<Cart>;
  getCart(id: string, buyerIp: string): Promise<Cart | null>;
  addLine(cartId: string, variantId: string, quantity: number, buyerIp: string): Promise<Cart>;
  updateLine(cartId: string, lineId: string, quantity: number, buyerIp: string): Promise<Cart>;
  setAttributes(cartId: string, attributes: Attr[], buyerIp: string): Promise<Cart>;
}

export type DemoOrder = { name: string };

/** What Stripe charged, for the Shopify order. Lines are null for sessions made before they carried variant IDs. */
export type PaidOrder = {
  amountPaid: number;
  lines: { variantId: string; quantity: number }[] | null;
  shipping: { title: string; amount: number } | null;
};

export interface ShopAdmin {
  createOrder(cart: Cart, sessionId: string, paid: PaidOrder): Promise<DemoOrder>;
  findOrderBySession(sessionId: string): Promise<DemoOrder | null>;
  countRecentDemoOrders(sinceIso: string): Promise<number>;
  deleteDemoOrdersBefore(iso: string): Promise<number>;
}
