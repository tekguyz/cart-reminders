import { ORDERS_PER_HOUR, SESSIONS_PER_HOUR, overCap } from "@/lib/caps";
import type { Checkout } from "@/lib/checkout/types";
import { signCartToken, verifyCartToken } from "@/lib/reminder-token";
import type { Cart, Shop, ShopAdmin } from "@/lib/shopify/types";
import { ownerNumbers, type OwnerCart, type OwnerNumbers } from "./owner";
import { SAMPLE_HISTORY } from "./sample-history";
import { INITIAL_STATE, type DemoState, leave, markPaid, skipAhead, stateFromAttributes, stateToAttributes } from "./state";

// Everything the demo's server actions do, over the Shop, ShopAdmin and
// Checkout interfaces. Testable with the fakes; no Next.js here.

export type CartView = { cart: Cart; state: DemoState; token: string | null };
export type Failure = { error: "busy" | "empty" | "not-found" | "not-paid" | "no-checkout" | "paid" };

type Deps = { shop: Shop; admin: ShopAdmin; checkout: Checkout; secret: string; now?: () => number };

const MAX_CARTS = 20;

export function createService({ shop, admin, checkout, secret, now = Date.now }: Deps) {
  const view = (cart: Cart): CartView => {
    const state = stateFromAttributes(cart.attributes);
    const token = state.status === "shopping" ? null : signCartToken(cart.id, secret);
    return { cart, state, token };
  };

  const save = async (cartId: string, state: DemoState, ip: string) => view(await shop.setAttributes(cartId, stateToAttributes(state), ip));

  const load = async (cartId: string, ip: string) => {
    const cart = await shop.getCart(cartId, ip);
    return cart ? view(cart) : null;
  };

  // One completion at a time per session in this server process.
  const completing = new Map<string, Promise<CartView | Failure>>();

  const service = {
    async addToCart(cartId: string | null, variantId: string, quantity: number, ip: string): Promise<CartView> {
      const current = cartId ? await load(cartId, ip) : null;
      if (current && current.state.status !== "paid") return view(await shop.addLine(current.cart.id, variantId, quantity, ip));
      const cart = await shop.createCart(variantId, quantity, ip);
      return save(cart.id, INITIAL_STATE, ip);
    },

    async changeQty(cartId: string, lineId: string, quantity: number, ip: string): Promise<CartView | Failure> {
      const v = await load(cartId, ip);
      if (!v) return { error: "not-found" };
      if (v.state.status === "paid") return { error: "paid" };
      return view(await shop.updateLine(cartId, lineId, Math.max(0, Math.min(20, quantity)), ip));
    },

    async startCheckout(cartId: string, ip: string): Promise<(CartView & { sessionId: string; clientSecret: string }) | Failure> {
      const v = await load(cartId, ip);
      if (!v) return { error: "not-found" };
      if (v.state.status === "paid") return { error: "paid" };
      if (v.cart.lines.length === 0) return { error: "empty" };
      if (overCap(await checkout.countRecentSessions(Math.floor(now() / 1000) - 3600), SESSIONS_PER_HOUR)) return { error: "busy" };
      const { sessionId, clientSecret } = await checkout.start(v.cart);
      const saved = await save(cartId, { ...v.state, sessionId }, ip);
      return { ...saved, sessionId, clientSecret };
    },

    async leaveCheckout(cartId: string, ip: string): Promise<CartView | Failure> {
      const v = await load(cartId, ip);
      if (!v) return { error: "not-found" };
      if (!v.state.sessionId) return { error: "no-checkout" };
      const { recoveryUrl } = await checkout.expire(v.state.sessionId);
      return save(cartId, leave(v.state, v.state.sessionId, recoveryUrl), ip);
    },

    async skip(cartId: string, ip: string): Promise<CartView | Failure> {
      const v = await load(cartId, ip);
      if (!v) return { error: "not-found" };
      const next = skipAhead(v.state);
      return next === v.state ? v : save(cartId, next, ip);
    },

    async completeOrder(sessionId: string, ip: string): Promise<CartView | Failure> {
      const running = completing.get(sessionId);
      if (running) return running;
      const job = (async (): Promise<CartView | Failure> => {
        const paid = await checkout.paid(sessionId);
        if (!paid.paid || !paid.cartId) return { error: "not-paid" };
        const v = await load(paid.cartId, ip);
        if (!v) return { error: "not-found" };
        if (v.state.status === "paid") return v;
        let order = await admin.findOrderBySession(sessionId);
        if (!order && !overCap(await admin.countRecentDemoOrders(new Date(now() - 3600_000).toISOString()), ORDERS_PER_HOUR)) {
          order = await admin.createOrder(v.cart, sessionId, paid.amountPaid);
        }
        return save(v.cart.id, markPaid(v.state, order?.name ?? ""), ip);
      })();
      completing.set(sessionId, job);
      try {
        return await job;
      } finally {
        completing.delete(sessionId);
      }
    },

    async restore(token: string, ip: string): Promise<CartView | null> {
      const cartId = verifyCartToken(token, secret);
      return cartId ? load(cartId, ip) : null;
    },

    async loadCarts(ids: string[], ip: string): Promise<{ carts: CartView[]; owner: OwnerNumbers }> {
      const found = await Promise.all([...new Set(ids)].slice(-MAX_CARTS).map((id) => load(id, ip).catch(() => null)));
      const carts = found.filter((c): c is CartView => c !== null);
      const mine: OwnerCart[] = carts.map(({ state }) => ({
        status: state.status,
        wonBack: state.wonBack,
        everLeft: state.everLeft,
        reminded: state.status === "reminded-1" || state.status === "reminded-2" || state.wonBack,
      }));
      return { carts, owner: ownerNumbers(SAMPLE_HISTORY, mine) };
    },
  };
  return service;
}

export type Service = ReturnType<typeof createService>;
