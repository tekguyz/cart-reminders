import { describe, expect, it } from "vitest";
import { createVisitorStore } from "../visitor-store";

function memoryStorage(): Storage {
  const m = new Map<string, string>();
  return {
    getItem: (k: string) => m.get(k) ?? null,
    setItem: (k: string, v: string) => void m.set(k, v),
    removeItem: (k: string) => void m.delete(k),
    clear: () => m.clear(),
    key: () => null,
    length: 0,
  };
}

const blocked = {
  getItem: () => {
    throw new Error("blocked");
  },
  setItem: () => {
    throw new Error("blocked");
  },
} as unknown as Storage;

describe("visitor store", () => {
  it("keeps the current cart and past carts", () => {
    const s = createVisitorStore(memoryStorage());
    expect(s.currentCartId()).toBeNull();
    s.setCurrent("a");
    s.startFresh();
    expect(s.currentCartId()).toBeNull();
    s.setCurrent("b");
    expect(s.currentCartId()).toBe("b");
    expect(s.getCartIds()).toEqual(["a", "b"]);
  });

  it("falls back to memory when storage is blocked", () => {
    const s = createVisitorStore(blocked);
    s.setCurrent("a");
    expect(s.currentCartId()).toBe("a");
    expect(s.getCartIds()).toEqual(["a"]);
  });

  it("works with no storage at all (server render)", () => {
    const s = createVisitorStore(undefined);
    s.setCurrent("x");
    expect(s.currentCartId()).toBe("x");
  });
});
