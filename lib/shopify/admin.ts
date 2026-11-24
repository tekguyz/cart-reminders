import { createHash } from "node:crypto";
import type { Cart, DemoOrder, PaidOrder, ShopAdmin } from "./types";
import { SHOPIFY_API_VERSION } from "./version";

// The Admin API: test orders written after a paid Stripe checkout, and the
// daily cleanup. Server-only.

/**
 * The tag that ties a Shopify order to its Stripe Checkout Session. Shopify
 * caps a tag at 40 characters and a session ID is about 66, so the tag holds
 * a hash of it: "stripe-" plus 32 hex characters.
 */
export function sessionTag(sessionId: string): string {
  return `stripe-${createHash("sha256").update(sessionId).digest("hex").slice(0, 32)}`;
}

const money = (c: number, currencyCode: string) => ({ shopMoney: { amount: (c / 100).toFixed(2), currencyCode } });

/** The order Stripe charged for: its lines and shipping, falling back to the cart's lines. */
export function orderInput(cart: Cart, sessionId: string, { amountPaid, lines, shipping }: PaidOrder) {
  return {
    order: {
      lineItems: lines ?? cart.lines.map((l) => ({ variantId: l.variantId, quantity: l.quantity })),
      ...(shipping ? { shippingLines: [{ title: shipping.title, priceSet: money(shipping.amount, cart.currency) }] } : {}),
      test: true,
      financialStatus: "PAID",
      tags: ["demo", sessionTag(sessionId)],
      note: "Demo order: paid with a Stripe test card. Nothing was charged.",
      transactions: [{ kind: "SALE", status: "SUCCESS", test: true, gateway: "stripe", amountSet: money(amountPaid, cart.currency) }],
    },
    options: { inventoryBehaviour: "BYPASS", sendReceipt: false, sendFulfillmentReceipt: false },
  };
}

type Options = { domain: string; getToken: () => Promise<string>; fetch?: typeof fetch };

export function createShopAdmin({ domain, getToken, fetch: f = fetch }: Options): ShopAdmin {
  async function gql<T>(query: string, variables: Record<string, unknown>): Promise<T> {
    const res = await f(`https://${domain}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": await getToken() },
      body: JSON.stringify({ query, variables }),
      cache: "no-store",
    });
    if (!res.ok) throw new Error(`Shopify Admin ${res.status}`);
    const json = (await res.json()) as { data?: T; errors?: { message: string }[] };
    if (json.errors?.length) throw new Error(json.errors.map((e) => e.message).join("; "));
    return json.data as T;
  }

  async function ordersMatching(q: string, first = 50) {
    const d = await gql<{ orders: { nodes: { id?: string; name: string }[] } }>(`query($q: String!, $first: Int!) { orders(first: $first, query: $q) { nodes { id name } } }`, { q, first });
    return d.orders.nodes;
  }

  return {
    async createOrder(cart, sessionId, paid) {
      const d = await gql<{ orderCreate: { order: { name: string } | null; userErrors: { message: string }[] } }>(
        `mutation($order: OrderCreateOrderInput!, $options: OrderCreateOptionsInput) { orderCreate(order: $order, options: $options) { order { name } userErrors { message } } }`,
        orderInput(cart, sessionId, paid),
      );
      if (d.orderCreate.userErrors.length || !d.orderCreate.order) throw new Error(d.orderCreate.userErrors.map((e) => e.message).join("; ") || "No order");
      return { name: d.orderCreate.order.name };
    },
    async findOrderBySession(sessionId): Promise<DemoOrder | null> {
      const [o] = await ordersMatching(`tag:'${sessionTag(sessionId)}'`, 1);
      return o ? { name: o.name } : null;
    },
    async countRecentDemoOrders(sinceIso) {
      return (await ordersMatching(`tag:demo created_at:>='${sinceIso}'`, 250)).length;
    },
    async deleteDemoOrdersBefore(iso) {
      const old = await ordersMatching(`tag:demo created_at:<'${iso}'`, 100);
      let deleted = 0;
      for (const o of old) {
        // Some API versions delete only cancelled or archived orders, so a
        // failed cancel is fine; only a delete with no userErrors counts.
        await gql(`mutation($id: ID!) { orderCancel(orderId: $id, reason: OTHER, refund: false, restock: false, notifyCustomer: false) { userErrors { message } } }`, { id: o.id }).catch(() => undefined);
        const d = await gql<{ orderDelete: { deletedId: string | null; userErrors: { message: string }[] } }>(`mutation($id: ID!) { orderDelete(orderId: $id) { deletedId userErrors { message } } }`, { id: o.id }).catch(() => null);
        if (d && d.orderDelete.userErrors.length === 0 && d.orderDelete.deletedId) deleted++;
      }
      return deleted;
    },
  };
}

/**
 * An Admin token: a fixed SHOPIFY_ADMIN_TOKEN when set, otherwise the Dev
 * Dashboard app's client credentials, cached until shortly before it expires.
 */
export function adminTokenSource(env: NodeJS.ProcessEnv, f: typeof fetch = fetch): () => Promise<string> {
  let cached: { token: string; until: number } | null = null;
  return async () => {
    if (env.SHOPIFY_ADMIN_TOKEN) return env.SHOPIFY_ADMIN_TOKEN;
    if (cached && cached.until > Date.now()) return cached.token;
    const res = await f(`https://${env.SHOPIFY_STORE_DOMAIN}/admin/oauth/access_token`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({ grant_type: "client_credentials", client_id: env.SHOPIFY_CLIENT_ID ?? "", client_secret: env.SHOPIFY_CLIENT_SECRET ?? "" }),
    });
    if (!res.ok) throw new Error(`Shopify token ${res.status}`);
    const j = (await res.json()) as { access_token: string; expires_in?: number };
    cached = { token: j.access_token, until: Date.now() + Math.max(60, (j.expires_in ?? 3600) - 300) * 1000 };
    return j.access_token;
  };
}
