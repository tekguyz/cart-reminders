"use client";

import { EmbeddedCheckout, EmbeddedCheckoutProvider } from "@stripe/react-stripe-js";
import { loadStripe, type Stripe } from "@stripe/stripe-js";
import { BRAND } from "@/lib/brand";
import { secondaryButton, shopButton } from "../ui";

export type OpenCheckout = { sessionId: string; clientSecret: string; fake: boolean };

const publishableKey = process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ?? "";
let stripePromise: Promise<Stripe | null> | null = null;
function stripe() {
  // The demo runs on Stripe test keys only.
  if (BRAND.demo && !publishableKey.startsWith("pk_test_")) return null;
  return (stripePromise ??= loadStripe(publishableKey));
}

/** Stripe's embedded checkout, in test mode, with the demo's "leave" door beside it. */
export function CheckoutPanel({ checkout, onLeave, onPaid, busy }: { checkout: OpenCheckout; onLeave: () => void; onPaid: (sessionId: string) => void; busy: boolean }) {
  const s = checkout.fake ? null : stripe();
  return (
    <div className="px-3 py-4 sm:px-5">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-3 rounded-[10px] border border-left/40 bg-left-soft px-3 py-2.5">
        <p className="text-label text-left-deep">Shoppers close the tab here all the time. Try it:</p>
        <button type="button" disabled={busy} onClick={onLeave} className={`${secondaryButton} border-left/50`}>
          Leave without paying
        </button>
      </div>
      <p className="mb-3 text-micro text-roast">
        Test mode. Pay with Stripe&rsquo;s test card <span className="font-semibold tabular-nums text-char">4242 4242 4242 4242</span>, any future date, any CVC. Nothing is charged.
      </p>
      {checkout.fake ? (
        <div className="rounded-[10px] border border-shop-line bg-white p-5 text-center">
          <p className="text-label text-roast">Local mode: Stripe is not connected.</p>
          <button type="button" disabled={busy} onClick={() => onPaid(checkout.sessionId)} className={`${shopButton} mt-3`}>
            Pay with the test card
          </button>
        </div>
      ) : s ? (
        <div className="overflow-hidden rounded-[10px] bg-white">
          <EmbeddedCheckoutProvider key={checkout.clientSecret} stripe={s} options={{ clientSecret: checkout.clientSecret, onComplete: () => onPaid(checkout.sessionId) }}>
            <EmbeddedCheckout />
          </EmbeddedCheckoutProvider>
        </div>
      ) : (
        <p role="alert" className="text-label text-danger">Checkout is not set up.</p>
      )}
    </div>
  );
}
