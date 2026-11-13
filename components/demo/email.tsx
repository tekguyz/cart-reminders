"use client";

import { BRAND } from "@/lib/brand";
import { clockLabel } from "@/lib/demo/clock";
import type { CartView } from "@/lib/demo/service";
import { REMINDER_HOURS, remindersSent } from "@/lib/demo/state";
import { ProductDrawing, StoreLogo } from "../ui";

const copy = [
  { subject: "Your coffee is still waiting", headline: "You left something at the roastery.", body: "We saved your cart. It's right where you left it, roasted this week and ready to ship or pick up." },
  { subject: "We kept your cart for you", headline: "Still thinking it over?", body: "Your cart is saved for a little longer. This is the last note we'll send about it." },
];

/** The reminder the store would send. Drawn here, never sent. */
export function ReminderEmail({ view }: { view: CartView | null }) {
  const sent = view ? remindersSent(view.state) : 0;
  if (!view || sent === 0 || !view.token) {
    return (
      <section aria-label={`${BRAND.shopperName}'s email`} className="grid min-h-80 place-items-center rounded-xl border border-dashed border-line bg-surface p-8 text-center">
        <div>
          <p className="font-display text-headline">No reminder yet.</p>
          <p className="mx-auto mt-2 max-w-[34ch] text-label text-muted">
            {view?.state.status === "left" ? "The cart was left at checkout. Skip ahead to when the first reminder goes out." : "Add something to the cart, start checkout, then leave without paying."}
          </p>
        </div>
      </section>
    );
  }
  const c = copy[sent - 1];
  const link = `/demo/back/${view.token}`;
  const leftAt = view.state.leftAtMin ?? 0;
  return (
    <section aria-label={`${BRAND.shopperName}'s email`} className="arrive relative overflow-hidden rounded-xl border border-line bg-bone">
      <span className="absolute top-3 right-3 rounded-md bg-ink px-2.5 py-1.5 text-micro font-semibold tracking-[0.06em] text-white uppercase">Not sent · demo</span>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-0.5 border-b border-shop-line bg-white px-4 py-3 pr-32 text-label text-muted sm:px-5">
        <dt>From</dt>
        <dd className="font-semibold text-ink">{BRAND.name}</dd>
        <dt>To</dt>
        <dd className="truncate">{BRAND.checkoutEmail}</dd>
        <dt>Subject</dt>
        <dd className="font-semibold text-ink">{c.subject}</dd>
        <dt>Sent</dt>
        <dd>{clockLabel(leftAt + REMINDER_HOURS[sent - 1] * 60)} on the demo clock</dd>
      </dl>
      <div className="max-w-[34rem] px-5 pt-6 pb-7 sm:px-7">
        <StoreLogo />
        <h2 className="mt-5 font-shop text-[2rem] leading-[1.05] text-char">{c.headline}</h2>
        <p className="mt-3 text-body text-roast">{c.body}</p>
        <ul className="mt-5 divide-y divide-[#F0E7D8] rounded-[10px] border border-shop-line bg-white px-3.5">
          {view.cart.lines.map((l) => (
            <li key={l.id} className="flex items-center gap-3 py-2.5 text-label">
              <ProductDrawing drawing={l.drawing} band={l.band} className="h-11 w-9" />
              <span className="flex-1">
                {l.productTitle} · {l.variantTitle}
              </span>
              <span className="text-muted tabular-nums">× {l.quantity}</span>
            </li>
          ))}
        </ul>
        <a href={link} className="mt-6 inline-flex min-h-12 items-center rounded-[9px] bg-cherry px-6 text-label font-semibold text-white hover:bg-[#743026]">
          Back to your cart
        </a>
        <p className="mt-4 text-micro text-[#8A7B6E]">
          {sent === 1 ? "One more note tomorrow if the cart is still open, then we stop." : "That's the last reminder. It stops here."}
          {view.state.recoveryUrl && (
            <>
              {" · "}
              <a href={view.state.recoveryUrl} target="_blank" rel="noreferrer" className="underline decoration-[#CDBDA8] underline-offset-2">
                Stripe&rsquo;s own recovery page
              </a>
            </>
          )}
        </p>
      </div>
      <div className="border-t border-shop-line bg-white px-5 py-4 sm:px-7">
        <p className="max-w-[38ch] rounded-2xl rounded-bl-sm border border-line bg-surface px-3.5 py-2.5 text-label">
          {BRAND.name}: your cart is saved. Tap to finish your order: {BRAND.address}/back
          <span className="mt-1 block text-micro text-muted">The text that would go out · not sent</span>
        </p>
      </div>
    </section>
  );
}
