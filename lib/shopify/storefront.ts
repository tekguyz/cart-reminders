import type { Drawing } from "@/lib/brand/marks";
import { colors } from "@/lib/brand/marks";
import type { Attr, Cart, Product, Shop } from "./types";
import { SHOPIFY_API_VERSION } from "./version";

// The Storefront API: products and carts. Server-only: it uses the private
// token, and sends the visitor's IP so Shopify does not throttle every
// visitor as one buyer.

type Value = { value: string } | null | undefined;
type Money = { amount: string; currencyCode?: string };

export type ProductNode = {
  id: string;
  handle: string;
  title: string;
  featuredImage?: { url: string } | null;
  region?: Value;
  notes?: Value;
  pickupOnly?: Value;
  band?: Value;
  drawing?: Value;
  variants?: { nodes: { id: string; title: string; price: Money }[] };
};

type CartNode = {
  id: string;
  cost: { subtotalAmount: Money };
  attributes: Attr[];
  lines: { nodes: { id: string; quantity: number; merchandise: { id: string; title: string; price: Money; product: ProductNode } }[] };
};

const PRODUCT_FIELDS = `
  id handle title
  featuredImage { url }
  region: metafield(namespace: "coquimba", key: "region") { value }
  notes: metafield(namespace: "coquimba", key: "notes") { value }
  pickupOnly: metafield(namespace: "coquimba", key: "pickup_only") { value }
  band: metafield(namespace: "coquimba", key: "band") { value }
  drawing: metafield(namespace: "coquimba", key: "drawing") { value }
`;

const CART_FIELDS = `
  id
  cost { subtotalAmount { amount currencyCode } }
  attributes { key value }
  lines(first: 50) { nodes { id quantity merchandise { ... on ProductVariant { id title price { amount } product { ${PRODUCT_FIELDS} } } } } }
`;

export const cents = (m: Money) => Math.round(parseFloat(m.amount) * 100);
const DRAWINGS: Drawing[] = ["bag", "cup", "rings"];

export function mapProduct(n: ProductNode): Product {
  const drawing = n.drawing?.value as Drawing;
  return {
    id: n.id,
    handle: n.handle,
    title: n.title,
    region: n.region?.value || null,
    notes: n.notes?.value ?? "",
    pickupOnly: n.pickupOnly?.value === "true",
    band: /^#[0-9a-f]{6}$/i.test(n.band?.value ?? "") ? n.band!.value : colors.char,
    drawing: DRAWINGS.includes(drawing) ? drawing : "bag",
    image: n.featuredImage?.url ?? null,
    variants: (n.variants?.nodes ?? []).map((v) => ({ id: v.id, title: v.title, price: cents(v.price) })),
  };
}

export function mapCart(n: CartNode): Cart {
  return {
    id: n.id,
    subtotal: cents(n.cost.subtotalAmount),
    currency: n.cost.subtotalAmount.currencyCode ?? "USD",
    attributes: n.attributes,
    lines: n.lines.nodes.map((l) => {
      const p = mapProduct(l.merchandise.product);
      return {
        id: l.id,
        variantId: l.merchandise.id,
        productTitle: p.title,
        variantTitle: l.merchandise.title,
        quantity: l.quantity,
        price: cents(l.merchandise.price),
        pickupOnly: p.pickupOnly,
        band: p.band,
        drawing: p.drawing,
      };
    }),
  };
}

type Options = { domain: string; token: string; fetch?: typeof fetch };

export function createStorefrontShop({ domain, token, fetch: f = fetch }: Options): Shop {
  async function gql<T>(query: string, variables: Record<string, unknown>, buyerIp?: string): Promise<T> {
    const headers: Record<string, string> = { "Content-Type": "application/json", "Shopify-Storefront-Private-Token": token };
    if (buyerIp) headers["Shopify-Storefront-Buyer-IP"] = buyerIp;
    const res = await f(`https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`, { method: "POST", headers, body: JSON.stringify({ query, variables }), cache: "no-store" });
    if (!res.ok) throw new Error(`Shopify Storefront ${res.status}`);
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
    return json.data as T;
  }

  type Mut = { cart: CartNode | null; userErrors: { message: string }[] };
  function cartOf(m: Mut): Cart {
    if (m.userErrors?.length) throw new Error(m.userErrors.map((e) => e.message).join("; "));
    if (!m.cart) throw new Error("Shopify returned no cart");
    return mapCart(m.cart);
  }

  return {
    async listProducts() {
      const d = await gql<{ products: { nodes: ProductNode[] } }>(`query { products(first: 50, sortKey: CREATED_AT, query: "tag_not:coquimba-site AND tag_not:secret-roast") { nodes { ${PRODUCT_FIELDS} variants(first: 10) { nodes { id title price { amount } } } } } }`, {});
      return d.products.nodes.map(mapProduct);
    },
    async createCart(variantId, quantity, ip) {
      const d = await gql<{ cartCreate: Mut }>(`mutation($input: CartInput!) { cartCreate(input: $input) { cart { ${CART_FIELDS} } userErrors { message } } }`, { input: { lines: [{ merchandiseId: variantId, quantity }] } }, ip);
      return cartOf(d.cartCreate);
    },
    async getCart(id, ip) {
      const d = await gql<{ cart: CartNode | null }>(`query($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`, { id }, ip);
      return d.cart ? mapCart(d.cart) : null;
    },
    async addLine(cartId, variantId, quantity, ip) {
      const d = await gql<{ cartLinesAdd: Mut }>(`mutation($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`, { cartId, lines: [{ merchandiseId: variantId, quantity }] }, ip);
      return cartOf(d.cartLinesAdd);
    },
    async updateLine(cartId, lineId, quantity, ip) {
      if (quantity <= 0) {
        const d = await gql<{ cartLinesRemove: Mut }>(`mutation($cartId: ID!, $ids: [ID!]!) { cartLinesRemove(cartId: $cartId, lineIds: $ids) { cart { ${CART_FIELDS} } userErrors { message } } }`, { cartId, ids: [lineId] }, ip);
        return cartOf(d.cartLinesRemove);
      }
      const d = await gql<{ cartLinesUpdate: Mut }>(`mutation($cartId: ID!, $lines: [CartLineUpdateInput!]!) { cartLinesUpdate(cartId: $cartId, lines: $lines) { cart { ${CART_FIELDS} } userErrors { message } } }`, { cartId, lines: [{ id: lineId, quantity }] }, ip);
      return cartOf(d.cartLinesUpdate);
    },
    async setAttributes(cartId, attributes, ip) {
      const d = await gql<{ cartAttributesUpdate: Mut }>(`mutation($cartId: ID!, $attributes: [AttributeInput!]!) { cartAttributesUpdate(cartId: $cartId, attributes: $attributes) { cart { ${CART_FIELDS} } userErrors { message } } }`, { cartId, attributes }, ip);
      return cartOf(d.cartAttributesUpdate);
    },
  };
}
