import type Stripe from "stripe";
import type { Cart } from "@/lib/shopify/types";

// The Stripe Checkout Session for a Shopify cart. Pure. Names, quantities and
// prices come from the cart the server read from Shopify, never from the browser.

/** Sample flat shipping, in cents. Shown only inside Stripe's checkout. */
export const SHIPPING_CENTS = 600;

type Opts = { email: string; expiresAt: number; pickupLabel: string };

export function buildSessionParams(cart: Cart, { email, expiresAt, pickupLabel }: Opts): Stripe.Checkout.SessionCreateParams {
  if (cart.lines.length === 0) throw new Error("The cart is empty");
  const currency = cart.currency.toLowerCase();
  const pickupOnly = cart.lines.some((l) => l.pickupOnly);
  const rate = (display_name: string, amount: number): Stripe.Checkout.SessionCreateParams.ShippingOption => ({
    shipping_rate_data: { type: "fixed_amount", display_name, fixed_amount: { amount, currency } },
  });
  return {
    ui_mode: "embedded_page",
    redirect_on_completion: "never",
    mode: "payment",
    customer_email: email,
    expires_at: expiresAt,
    after_expiration: { recovery: { enabled: true } },
    metadata: { cart_id: cart.id, app: "cart-reminders" },
    line_items: cart.lines.map((l) => ({
      quantity: l.quantity,
      price_data: { currency, unit_amount: l.price, product_data: { name: l.productTitle, description: l.variantTitle, metadata: { variant_id: l.variantId } } },
    })),
    // No address collection: a visitor never types a real address in the demo.
    shipping_options: pickupOnly ? [rate(pickupLabel, 0)] : [rate(pickupLabel, 0), rate("Shipping", SHIPPING_CENTS)],
  };
}

/** The demo runs on Stripe test keys only. */
export function assertTestKey(key: string | undefined): asserts key is string {
  if (!key || !/^(sk|pk|rk)_test_/.test(key)) throw new Error("The demo runs on Stripe test keys only");
}

type PaidLineItem = { quantity: number | null; price: { product: string | object } | null };

/** The Shopify lines Stripe charged for, or null when a line has no variant ID (sessions made before it was added). */
export function paidLines(items: PaidLineItem[]): { variantId: string; quantity: number }[] | null {
  const lines = items.map((i) => {
    const product = i.price?.product;
    const variantId = product && typeof product === "object" && "metadata" in product ? (product.metadata as Record<string, string> | null)?.variant_id : undefined;
    return variantId && i.quantity ? { variantId, quantity: i.quantity } : null;
  });
  return lines.length > 0 && lines.every((l) => l !== null) ? (lines as { variantId: string; quantity: number }[]) : null;
}

/** The shipping the shopper picked in Stripe, or null when none was charged for. */
export function paidShipping(cost: { amount_total: number; shipping_rate: string | { display_name: string | null } | null } | null): { title: string; amount: number } | null {
  if (!cost || cost.amount_total <= 0) return null;
  const rate = cost.shipping_rate;
  return { title: (typeof rate === "object" && rate?.display_name) || "Shipping", amount: cost.amount_total };
}
