"use client";

import { BRAND } from "@/lib/brand";
import { clockLabel, untilLabel } from "@/lib/demo/clock";
import type { OwnerNumbers } from "@/lib/demo/owner";
import { SAMPLE_CARTS } from "@/lib/demo/sample-history";
import type { CartView } from "@/lib/demo/service";
import { REMINDER_HOURS, nextReminderAtMin, type CartStatus } from "@/lib/demo/state";

const TAG: Record<CartStatus | "won", { label: string; cls: string }> = {
  shopping: { label: "In the cart", cls: "bg-sunk text-muted" },
  left: { label: "Left", cls: "bg-left-soft text-left-deep" },
  "reminded-1": { label: "Reminded", cls: "bg-left-soft text-left-deep" },
  "reminded-2": { label: "Reminded twice", cls: "bg-left-soft text-left-deep" },
  paid: { label: "Paid", cls: "bg-sunk text-muted" },
  won: { label: "Won back", cls: "bg-back-soft text-back-deep" },
};

function Tag({ status, won }: { status: CartStatus; won: boolean }) {
  const t = TAG[won ? "won" : status];
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-micro font-semibold whitespace-nowrap ${t.cls}`}>
      <i aria-hidden className="size-1.5 rounded-full bg-current" />
      {t.label}
    </span>
  );
}

const items = (v: CartView) => v.cart.lines.map((l) => (l.quantity > 1 ? `${l.productTitle} × ${l.quantity}` : l.productTitle)).join(", ") || "Empty";

/** The store's own numbers on carts left and won back (offering 3). */
export function OwnerPanel({ owner, carts, currentId }: { owner: OwnerNumbers; carts: CartView[]; currentId: string | null }) {
  const nums: [string, number, string][] = [
    ["Carts started", owner.started, "border border-line"],
    ["Left at checkout", owner.left, "bg-left-soft text-left-deep"],
    ["Reminded", owner.reminded, "border border-line"],
    ["Won back", owner.wonBack, "bg-back-soft text-back-deep"],
  ];
  const mine = [...carts].reverse();
  return (
    <section aria-label="Store owner" className="flex flex-col gap-4 rounded-xl border border-line bg-surface p-4 sm:p-5">
      <div className="flex items-baseline justify-between gap-3">
        <h2 className="font-display text-headline">Store owner</h2>
        <span className="text-micro text-muted">{BRAND.name} · this week</span>
      </div>
      <dl className="grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
        {nums.map(([label, n, cls]) => (
          <div key={label} className={`flex flex-col-reverse rounded-[9px] p-2.5 ${cls}`}>
            <dt className="mt-1 text-micro opacity-80">{label}</dt>
            <dd className="font-display text-[1.9rem] leading-none tabular-nums">{n}</dd>
          </div>
        ))}
      </dl>
      <p className="text-micro text-muted">{owner.orders} orders this week. Sample history plus your own carts. Paid orders land in the shop&rsquo;s Shopify store as test orders.</p>
      <ul className="-mx-4 sm:-mx-5">
        {mine.map((v) => (
          <li key={v.cart.id} className={`arrive grid grid-cols-[1fr_auto] gap-x-3 border-t border-hair px-4 py-2.5 text-label sm:px-5 ${v.cart.id === currentId ? "bg-[linear-gradient(90deg,var(--color-back-soft),transparent_75%)]" : ""}`}>
            <span className="font-semibold">You{v.state.orderName ? ` · order ${v.state.orderName}` : ""}</span>
            <span className="row-span-2 self-center">
              <Tag status={v.state.status} won={v.state.wonBack} />
            </span>
            <span className="text-muted">{items(v)}</span>
          </li>
        ))}
        {SAMPLE_CARTS.slice(0, 5).map((c) => (
          <li key={c.who} className="grid grid-cols-[1fr_auto] gap-x-3 border-t border-hair px-4 py-2.5 text-label sm:px-5">
            <span className="font-semibold">
              {c.who} · {c.day}
            </span>
            <span className="row-span-2 self-center">
              <Tag status={c.status} won={c.wonBack} />
            </span>
            <span className="text-muted">{c.items}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** The current cart, step by step, on the demo clock. */
export function Timeline({ view }: { view: CartView | null }) {
  if (!view || view.state.leftAtMin === null) return null;
  const s = view.state;
  const left = s.leftAtMin!;
  const sent = s.status === "reminded-1" ? 1 : s.status === "reminded-2" ? 2 : s.status === "paid" && s.wonBack ? 1 : 0;
  const steps = [
    { on: true, title: "Left at checkout", note: `${clockLabel(left)} · the checkout was closed` },
    ...REMINDER_HOURS.map((h, i) => ({
      on: sent > i || (s.status === "reminded-2" && i < 2),
      title: i === 0 ? "First reminder" : "Second reminder",
      note: sent > i ? `${clockLabel(left + h * 60)} · email and text, drawn here, not sent` : i === 0 ? `${untilLabel(s.clockMin, left + h * 60)} after leaving` : "Only if the cart is still open",
    })),
    { on: s.status === "paid", title: s.status === "paid" ? (s.wonBack ? "Came back and paid" : "Paid") : "Stops", note: s.status === "paid" ? "Reminders stop the moment the cart is paid" : "The moment the cart is paid" },
  ];
  const next = nextReminderAtMin(s);
  return (
    <section aria-label="Your cart, step by step" className="rounded-xl border border-line bg-surface p-4 sm:p-5">
      <h2 className="text-label font-semibold">Your cart, step by step</h2>
      <ol className="relative mt-3 pl-6 before:absolute before:top-1.5 before:bottom-1.5 before:left-[7px] before:w-0.5 before:bg-line">
        {steps.map((st) => (
          <li key={st.title} className="relative pb-3 text-label last:pb-0">
            <span aria-hidden className={`absolute top-1 -left-6 size-3.5 rounded-full border-2 ${st.on ? (st.title.startsWith("Came") ? "border-back bg-back" : "border-left bg-left") : "border-dashed border-line bg-white"}`} />
            {st.title}
            <span className="block text-micro text-muted">{st.note}</span>
          </li>
        ))}
      </ol>
      {next !== null && <p className="mt-3 text-micro text-muted">Next reminder {untilLabel(s.clockMin, next)} on the demo clock.</p>}
    </section>
  );
}
