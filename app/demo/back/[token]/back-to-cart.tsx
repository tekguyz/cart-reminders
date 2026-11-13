"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { BRAND } from "@/lib/brand";
import { browserVisitorStore } from "@/lib/visitor-store";

export function BackToCart({ cartId }: { cartId: string }) {
  const router = useRouter();
  useEffect(() => {
    browserVisitorStore().setCurrent(cartId);
    router.replace("/demo?checkout=1");
  }, [cartId, router]);
  return (
    <main id="main" className="grid flex-1 place-items-center px-4 py-24 text-center">
      <p className="font-shop text-title text-char">Opening your cart at {BRAND.name}…</p>
    </main>
  );
}
