"use client";

// The whole demo on one screen: the shop, the shopper's email, and the store
// owner's side. Rules live in lib/; carts live in Shopify; this file holds
// only what is on screen. Cart IDs are kept in the page's own storage (ADR 0002).

import { useCallback, useEffect, useRef, useState } from "react";
import { addToCart, changeQty, completeOrder, fakePay, leaveCheckout, loadCarts, skipAhead, startCheckout } from "@/app/demo/actions";
import { BRAND } from "@/lib/brand";
import { clockLabel, untilLabel } from "@/lib/demo/clock";
import type { OwnerNumbers } from "@/lib/demo/owner";
import type { CartView, Failure } from "@/lib/demo/service";
import { nextReminderAtMin } from "@/lib/demo/state";
import type { Product } from "@/lib/shopify/types";
import { browserVisitorStore, type VisitorStore } from "@/lib/visitor-store";
import { secondaryButton } from "../ui";
import { DemoBanner } from "./banner";
import type { OpenCheckout } from "./checkout-panel";
import { ReminderEmail } from "./email";
import { OwnerPanel, Timeline } from "./owner-panel";
import { Shop, type ShopScreen } from "./shop";

type Pane = "shop" | "email" | "owner";
type Tour = { added: boolean; left: boolean; reminded: boolean; paidBack: boolean; sawOrder: boolean };
const noTour: Tour = { added: false, left: false, reminded: false, paidBack: false, sawOrder: false };
const tourSteps: [keyof Tour, string][] = [
  ["added", "Add to cart"],
  ["left", "Leave at checkout"],
  ["reminded", "Skip ahead to the reminder"],
  ["paidBack", "Come back and pay"],
  ["sawOrder", "See it on the owner side"],
];

const MESSAGES: Record<Failure["error"] | "bad-input" | "failed", string> = {
  busy: "The demo is busy right now. Try again in a little while.",
  empty: "The cart is empty. Add something first.",
  "not-found": "That cart has expired. Starting a fresh one.",
  "not-paid": "The payment did not go through. Try the test card again.",
  "no-checkout": "Start checkout first.",
  paid: "This cart is already paid. Add something to start a new one.",
  "bad-input": "Something went wrong. Try again.",
  failed: "The store did not answer. Try again in a moment.",
};

const isFailure = (r: unknown): r is { error: keyof typeof MESSAGES } => typeof r === "object" && r !== null && "error" in r;

export function DemoApp({ products, fake, openCheckoutOnLoad }: { products: Product[]; fake: boolean; openCheckoutOnLoad: boolean }) {
  const store = useRef<VisitorStore | null>(null);
  const [view, setView] = useState<CartView | null>(null);
  const [carts, setCarts] = useState<CartView[]>([]);
  const [owner, setOwner] = useState<OwnerNumbers | null>(null);
  const [screen, setScreen] = useState<ShopScreen>("shop");
  const [pane, setPane] = useState<Pane>("shop");
  const [unseen, setUnseen] = useState<Pane | null>(null);
  const [checkout, setCheckout] = useState<OpenCheckout | null>(null);
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [tour, setTour] = useState<Tour>(noTour);
  // Paid, but the order was not written yet: keep the session so the shopper can retry.
  const [retryPay, setRetryPay] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const s = store.current!;
    const { carts: found, owner: o } = await loadCarts(s.getCartIds());
    setCarts(found);
    setOwner(o);
    const current = found.find((c) => c.cart.id === s.currentCartId()) ?? null;
    setView(current);
    return current;
  }, []);

  const begin = useCallback(
    async (cartId: string) => {
      setBusy(true);
      setMessage(null);
      try {
        const r = await startCheckout(cartId);
        if (isFailure(r)) return setMessage(MESSAGES[r.error]);
        setView(r);
        setCheckout({ sessionId: r.sessionId, clientSecret: r.clientSecret, fake });
        setScreen("checkout");
      } catch {
        setMessage(MESSAGES.failed);
      } finally {
        setBusy(false);
      }
    },
    [fake],
  );

  useEffect(() => {
    store.current = browserVisitorStore();
    void (async () => {
      try {
        const current = await refresh();
        if (current) {
          setTour((t) => ({ ...t, added: true, left: current.state.everLeft, reminded: current.state.status.startsWith("reminded") || current.state.wonBack }));
          if (openCheckoutOnLoad && current.state.status !== "paid") await begin(current.cart.id);
        }
        if (openCheckoutOnLoad) {
          // Drop ?checkout=1 so a reload doesn't reopen checkout.
          window.history.replaceState(null, "", "/demo");
        }
      } catch {
        setMessage(MESSAGES.failed);
      }
    })();
  }, [refresh, begin, openCheckoutOnLoad]);

  // Keep the owner panel in step with the current cart.
  const accept = (v: CartView) => {
    setView(v);
    store.current!.setCurrent(v.cart.id);
    setCarts((cs) => (cs.some((c) => c.cart.id === v.cart.id) ? cs.map((c) => (c.cart.id === v.cart.id ? v : c)) : [...cs, v]));
    void loadCarts(store.current!.getCartIds()).then((r) => setOwner(r.owner));
  };

  async function run<T>(fn: () => Promise<T | { error: keyof typeof MESSAGES }>, ok: (v: T) => void, failed?: () => void) {
    setBusy(true);
    setMessage(null);
    try {
      const r = await fn();
      if (isFailure(r)) {
        setMessage(MESSAGES[r.error]);
        failed?.();
      } else ok(r as T);
    } catch {
      setMessage(MESSAGES.failed);
      failed?.();
    } finally {
      setBusy(false);
    }
  }

  const notice = (p: Pane) => {
    if (pane !== p && !window.matchMedia("(min-width: 64rem)").matches) setUnseen(p);
  };

  const onAdd = (variantId: string) =>
    run(
      () => addToCart(view?.state.status === "paid" ? null : (view?.cart.id ?? null), variantId, 1),
      (v: CartView) => {
        accept(v);
        setTour((t) => ({ ...t, added: true }));
        notice("owner");
      },
    );

  const onQty = (lineId: string, qty: number) => view && run(() => changeQty(view.cart.id, lineId, qty), accept);

  const onLeave = () =>
    view &&
    run(
      () => leaveCheckout(view.cart.id),
      (v: CartView) => {
        accept(v);
        setCheckout(null);
        setScreen("shop");
        setTour((t) => ({ ...t, left: true }));
        notice("owner");
      },
    );

  const onSkip = () =>
    view &&
    run(
      () => skipAhead(view.cart.id),
      (v: CartView) => {
        accept(v);
        setTour((t) => ({ ...t, reminded: true }));
        setPane("email");
        setUnseen(null);
      },
    );

  const onPaid = (sessionId: string) =>
    run(
      () => (fake ? fakePay(sessionId) : completeOrder(sessionId)),
      (v: CartView) => {
        accept(v);
        setRetryPay(null);
        setCheckout(null);
        setScreen("paid");
        const wide = window.matchMedia("(min-width: 64rem)").matches;
        setTour((t) => ({ ...t, paidBack: t.paidBack || v.state.wonBack, sawOrder: t.sawOrder || wide }));
        notice("owner");
      },
      () => setRetryPay(sessionId),
    );

  const onReset = () => {
    store.current!.startFresh();
    setView(null);
    setCheckout(null);
    setScreen("shop");
    setPane("shop");
    setMessage(null);
    setRetryPay(null);
    setTour(noTour);
  };

  const choose = (p: Pane) => {
    setPane(p);
    if (unseen === p) setUnseen(null);
    if (p === "owner" && view?.state.status === "paid") setTour((t) => ({ ...t, sawOrder: true }));
  };

  const next = view ? nextReminderAtMin(view.state) : null;
  const showClock = !!view && view.state.leftAtMin !== null;

  const tabBtn = (p: Pane, label: string, cls = "") => (
    <button key={p} type="button" aria-pressed={pane === p} onClick={() => choose(p)} className={`relative inline-flex min-h-11 items-center gap-2 rounded-lg px-4 text-label font-semibold ${pane === p ? "bg-ink text-white" : "text-muted hover:bg-sunk"} ${cls}`}>
      {label}
      {unseen === p && (
        <>
          <i aria-hidden className="size-2 rounded-full bg-left" />
          <span className="sr-only">, new</span>
        </>
      )}
    </button>
  );

  return (
    <>
      <DemoBanner onReset={onReset} />
      <div className="border-b border-line">
        <div className="mx-auto flex max-w-[90rem] flex-wrap items-center gap-2 px-4 py-3 text-label sm:px-6">
          <span className="mr-1 font-semibold">Things to try</span>
          {tourSteps.map(([k, label]) => (
            <span key={k} className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 ${tour[k] ? "bg-back-soft text-back-deep" : "border border-line bg-surface text-muted"}`}>
              {tour[k] && (
                <svg aria-hidden viewBox="0 0 12 12" className="size-3">
                  <circle cx="6" cy="6" r="6" fill="currentColor" />
                  <path d="M3 6.2l2 2 4-4.4" fill="none" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              )}
              {label}
              <span className="sr-only">{tour[k] ? " (done)" : ""}</span>
            </span>
          ))}
        </div>
      </div>

      <main id="main" className="mx-auto w-full max-w-[90rem] flex-1 px-3 pt-4 pb-16 sm:px-6">
        <div role="group" aria-label="Demo screens" className="mb-3 flex gap-1 lg:hidden">
          {tabBtn("shop", "Shop")}
          {tabBtn("email", `${BRAND.shopperName}'s email`)}
          {tabBtn("owner", "Store owner")}
        </div>

        <div className="grid gap-4 lg:grid-cols-[1.55fr_1fr] lg:gap-5">
          <div className={`flex min-w-0 flex-col gap-3 ${pane === "owner" ? "hidden lg:flex" : ""}`}>
            {showClock && (
              <div className="flex flex-wrap items-center gap-3 rounded-xl border border-line bg-surface px-4 py-2.5">
                <span className="text-label text-muted">Demo clock</span>
                <span className="font-display text-title tabular-nums">{clockLabel(view!.state.clockMin)}</span>
                <span aria-hidden className="hairline-draw hidden h-0.5 min-w-10 flex-1 bg-left/60 sm:block" />
                <span className="text-micro text-muted">{next !== null ? `Next reminder ${untilLabel(view!.state.clockMin, next)}` : view!.state.status === "paid" ? "Paid. Reminders stopped." : "No more reminders."}</span>
                <button type="button" disabled={busy || next === null} onClick={onSkip} className={`${secondaryButton} ml-auto`}>
                  Skip ahead ›
                </button>
              </div>
            )}
            <div role="group" aria-label="Shopper screens" className="hidden gap-1 lg:flex">
              {tabBtn("shop", "The shop")}
              {tabBtn("email", `${BRAND.shopperName}'s email`)}
            </div>
            <div className={pane === "email" ? "hidden" : ""}>
              {products.length === 0 ? (
                <p className="rounded-xl border border-line bg-surface p-6 text-label text-muted">The store has no products yet.</p>
              ) : (
                <Shop
                  products={products}
                  view={view}
                  screen={screen}
                  busy={busy}
                  message={message}
                  checkout={checkout}
                  onScreen={setScreen}
                  onAdd={onAdd}
                  onQty={onQty}
                  onCheckout={() => view && begin(view.cart.id)}
                  onLeave={onLeave}
                  onPaid={onPaid}
                  retryPay={retryPay}
                />
              )}
            </div>
            {pane === "email" && <ReminderEmail view={view} />}
          </div>

          <div className={`flex min-w-0 flex-col gap-3 ${pane === "owner" ? "" : "hidden lg:flex"}`}>
            {owner && <OwnerPanel owner={owner} carts={carts} currentId={view?.cart.id ?? null} />}
            <Timeline view={view} />
          </div>
        </div>
      </main>
    </>
  );
}
