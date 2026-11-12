import type { CartStatus } from "./state";

// The store's own numbers on carts left and won back (offering 3).

export type OwnerCart = { status: CartStatus; wonBack: boolean; reminded: boolean; everLeft?: boolean };

export type OwnerNumbers = { started: number; left: number; reminded: number; wonBack: number; orders: number };

export function ownerNumbers(history: OwnerCart[], mine: OwnerCart[]): OwnerNumbers {
  const all = [...history, ...mine];
  return {
    started: all.length,
    left: all.filter((c) => c.everLeft ?? c.status !== "shopping").length,
    reminded: all.filter((c) => c.reminded).length,
    wonBack: all.filter((c) => c.wonBack).length,
    orders: all.filter((c) => c.status === "paid").length,
  };
}
