"use client";

import dynamic from "next/dynamic";
import { useState } from "react";
import { BRAND } from "@/lib/brand";
import type { CartView } from "@/lib/demo/service";
import type { Product } from "@/lib/shopify/types";
import { ProductDrawing, StoreLogo, money, primaryButton, shopButton } from "../ui";
import type { OpenCheckout } from "./checkout-panel";

// Stripe's code loads only when checkout opens, not with the shop.
const CheckoutPanel = dynamic(() => import("./checkout-panel").then((m) => m.CheckoutPanel), {
  loading: () => <p className="px-5 py-10 text-center text-label text-roast">Opening checkout…</p>,
});

export type ShopScreen = "shop" | "cart" | "checkout" | "paid";

type Props = {
  products: Product[];
  view: CartView | null;
  screen: ShopScreen;
  busy: boolean;
  message: string | null;
  checkout: OpenCheckout | null;
  onScreen: (s: ShopScreen) => void;
  onAdd: (variantId: string) => void;
  onQty: (lineId: string, qty: number) => void;
  onCheckout: () => void;
  onLeave: () => void;
  onPaid: (sessionId: string) => void;
  retryPay: string | null;
};

/** The made-up store, drawn in a small browser frame (DESIGN.md). */
export function Shop(p: Props) {
  // A paid cart is done: the shop shows an empty cart until the next Add.
  const open = p.view && p.view.state.status !== "paid" ? p.view.cart.lines : [];
  const count = open.reduce((t, l) => t + l.quantity, 0);
  return (
    <section aria-label={`${BRAND.name}, the sample shop`} className="overflow-hidden rounded-xl border border-line bg-bone">
      <div className="flex items-center gap-2 border-b border-line bg-[#EFE9DE] px-3 py-2">
        <span aria-hidden className="flex gap-1.5">
          <i className="size-2.5 rounded-full bg-[#D3CBBB]" />
          <i className="size-2.5 rounded-full bg-[#D3CBBB]" />
          <i className="size-2.5 rounded-full bg-[#D3CBBB]" />
        </span>
        <span className="flex-1 truncate rounded-md bg-white px-2.5 py-1 text-micro text-muted">{BRAND.address}{p.screen === "shop" ? "" : p.screen === "cart" ? "/cart" : "/checkout"}</span>
      </div>

      <div className="flex items-center justify-between border-b border-shop-line px-4 py-3 sm:px-5">
        <button type="button" onClick={() => p.onScreen("shop")} className="min-h-11 hover:opacity-80" aria-label={`${BRAND.name}, back to the shop`}>
          <StoreLogo />
        </button>
        <button type="button" onClick={() => p.onScreen("cart")} className="inline-flex min-h-11 items-center gap-2 text-label font-semibold text-char underline-offset-4 hover:underline" aria-label={`Cart, ${count} items`}>
          Cart
          <span className="inline-grid min-w-5 place-items-center rounded-full bg-cherry px-1.5 text-micro text-white">{count}</span>
        </button>
      </div>

      {p.message && (
        <p role="alert" className="border-b border-shop-line bg-left-soft px-5 py-2 text-label text-left-deep">
          {p.message}
          {p.retryPay && (
            <button type="button" disabled={p.busy} onClick={() => p.onPaid(p.retryPay!)} className="ml-2 inline-flex min-h-11 items-center font-semibold underline underline-offset-4">
              Try again
            </button>
          )}
        </p>
      )}

      {p.screen === "shop" && <Catalog products={p.products} view={p.view} busy={p.busy} onAdd={p.onAdd} />}
      {p.screen === "cart" && <CartScreen {...p} />}
      {p.screen === "checkout" && p.checkout && <CheckoutPanel checkout={p.checkout} onLeave={p.onLeave} onPaid={p.onPaid} busy={p.busy} />}
      {p.screen === "paid" && p.view && <Paid view={p.view} onShop={() => p.onScreen("shop")} />}
    </section>
  );
}

function Catalog({ products, view, busy, onAdd }: { products: Product[]; view: CartView | null; busy: boolean; onAdd: (variantId: string) => void }) {
  return (
    <>
      <div className="flex flex-wrap items-end justify-between gap-3 bg-cream px-4 pt-5 pb-2 sm:px-5">
        <h2 className="max-w-[16ch] font-shop text-[1.75rem] leading-[1.05] text-char">{BRAND.tagline}</h2>
        <p className="max-w-[30ch] text-label text-roast">{BRAND.intro}</p>
      </div>
      <svg aria-hidden viewBox="0 0 600 34" preserveAspectRatio="none" className="block h-8 w-full bg-cream">
        <path d="M0 34V26h60l50-18 40 18h100l40-12 30 8 40-18 50 22h190v8z" fill="#FBF6EE" />
        <path d="M0 26h60l50-18 40 18h100l40-12 30 8 40-18 50 22h190" fill="none" stroke="#2A2320" strokeWidth="1.2" />
      </svg>
      <ul className="grid grid-cols-2 gap-3 p-3 sm:gap-3.5 sm:p-5 xl:grid-cols-3">
        {products.map((product) => (
          <ProductCard key={product.id} product={product} view={view} busy={busy} onAdd={onAdd} />
        ))}
      </ul>
    </>
  );
}

function ProductCard({ product, view, busy, onAdd }: { product: Product; view: CartView | null; busy: boolean; onAdd: (variantId: string) => void }) {
  const [variantId, setVariantId] = useState(product.variants[0]?.id ?? "");
  const variant = product.variants.find((v) => v.id === variantId) ?? product.variants[0];
  const inCart = view?.cart.lines.some((l) => product.variants.some((v) => v.id === l.variantId));
  if (!variant) return null;
  return (
    <li className="flex flex-col gap-2 rounded-[10px] border border-shop-line bg-white p-2.5 sm:p-3">
      <div className="grid h-32 place-items-center rounded-md bg-cream sm:h-36">
        <ProductDrawing drawing={product.drawing} band={product.band} className="h-28 w-[5.5rem] sm:h-32 sm:w-24" />
      </div>
      <h3 className="font-shop text-[1.0625rem] leading-tight text-char">{product.title}</h3>
      <p className="text-micro text-roast">{product.region && product.region !== product.title ? `${product.region} · ` : ""}{product.notes}</p>
      {product.pickupOnly && <p className="text-micro font-semibold text-shade">Pickup only</p>}
      <div className="mt-auto flex flex-col gap-2">
        {product.variants.length > 1 && (
          <label className="text-micro text-roast">
            <span className="sr-only">Size and grind for {product.title}</span>
            <select value={variantId} onChange={(e) => setVariantId(e.target.value)} className="min-h-11 w-full rounded-md border border-shop-line bg-bone px-2 text-label text-char">
              {product.variants.map((v) => (
                <option key={v.id} value={v.id}>
                  {v.title}
                </option>
              ))}
            </select>
          </label>
        )}
        <div className="flex items-center justify-between gap-2">
          <span className="text-label font-semibold tabular-nums text-char">{money(variant.price)}</span>
          <button type="button" disabled={busy} onClick={() => onAdd(variant.id)} className={`${shopButton} ${inCart ? "bg-shade hover:bg-shade" : ""}`} aria-label={`Add ${product.title}, ${variant.title}, to the cart`}>
            {inCart ? "Add more" : "Add"}
          </button>
        </div>
      </div>
    </li>
  );
}

function CartScreen(p: Props) {
  const lines = p.view && p.view.state.status !== "paid" ? p.view.cart.lines : [];
  if (lines.length === 0) {
    return (
      <div className="px-5 py-12 text-center">
        <p className="font-shop text-title text-char">Your cart is empty.</p>
        <button type="button" onClick={() => p.onScreen("shop")} className={`${shopButton} mt-4`}>
          See the coffee
        </button>
      </div>
    );
  }
  const pickupOnly = lines.some((l) => l.pickupOnly);
  return (
    <div className="px-4 py-5 sm:px-6">
      <h2 className="font-shop text-[1.6rem] text-char">Your cart</h2>
      <ul className="mt-3 divide-y divide-shop-line rounded-[10px] border border-shop-line bg-white px-3">
        {lines.map((l) => (
          <li key={l.id} className="flex flex-wrap items-center gap-x-3 gap-y-2 py-3">
            <ProductDrawing drawing={l.drawing} band={l.band} className="h-12 w-10" />
            <div className="min-w-0 flex-1">
              <p className="font-shop text-[1.05rem] text-char">{l.productTitle}</p>
              <p className="text-micro text-roast">{l.variantTitle}</p>
            </div>
            <div className="ml-auto flex items-center gap-3">
            <div className="flex items-center rounded-md border border-shop-line">
              <button type="button" disabled={p.busy} onClick={() => p.onQty(l.id, l.quantity - 1)} className="grid min-h-11 min-w-11 place-items-center text-char" aria-label={`One less ${l.productTitle}`}>
                −
              </button>
              <span className="min-w-6 text-center text-label tabular-nums">
                {l.quantity}
                <span className="sr-only"> in the cart</span>
              </span>
              <button type="button" disabled={p.busy} onClick={() => p.onQty(l.id, l.quantity + 1)} className="grid min-h-11 min-w-11 place-items-center text-char" aria-label={`One more ${l.productTitle}`}>
                +
              </button>
            </div>
            <span className="w-16 text-right text-label tabular-nums">{money(l.price * l.quantity)}</span>
            </div>
          </li>
        ))}
      </ul>
      <div className="mt-4 flex items-center justify-between text-label">
        <span className="text-roast">{pickupOnly ? "Pickup at the roastery (pinolillo and rosquillas are made here)." : "Pickup or shipping, picked at checkout."}</span>
        <span className="font-semibold tabular-nums">{money(p.view?.cart.subtotal ?? 0)}</span>
      </div>
      <button type="button" disabled={p.busy} onClick={p.onCheckout} className={`${primaryButton} mt-5 w-full bg-cherry hover:bg-[#743026]`}>
        {p.busy ? "Opening checkout…" : "Check out"}
      </button>
    </div>
  );
}

function Paid({ view, onShop }: { view: CartView; onShop: () => void }) {
  return (
    <div className="arrive px-5 py-10 text-center">
      <p className="text-micro font-semibold tracking-[0.12em] text-shade uppercase">Order placed</p>
      <h2 className="mt-2 font-shop text-[1.9rem] leading-tight text-char">Thank you, {BRAND.shopperName}.</h2>
      <p className="mx-auto mt-3 max-w-[36ch] text-body text-roast">
        {view.state.orderName ? `Order ${view.state.orderName} is in the shop's Shopify store as a test order.` : "Your test payment went through."} Nothing was charged.
      </p>
      <button type="button" onClick={onShop} className={`${shopButton} mt-6`}>
        Back to the shop
      </button>
    </div>
  );
}
