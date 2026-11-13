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
    metadata: { cart_id: cart.id },
    line_items: cart.lines.map((l) => ({
      quantity: l.quantity,
      price_data: { currency, unit_amount: l.price, product_data: { name: l.productTitle, description: l.variantTitle } },
    })),
    // No address collection: a visitor never types a real address in the demo.
    shipping_options: pickupOnly ? [rate(pickupLabel, 0)] : [rate(pickupLabel, 0), rate("Shipping", SHIPPING_CENTS)],
  };
}

/** The demo runs on Stripe test keys only. */
export function assertTestKey(key: string | undefined): asserts key is string {
  if (!key || !/^(sk|pk|rk)_test_/.test(key)) throw new Error("The demo runs on Stripe test keys only");
}
