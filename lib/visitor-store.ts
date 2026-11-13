// The visitor's cart IDs, kept in the page's own storage (ADR 0002). A frame
// still gets localStorage (partitioned by the top site); when storage is
// blocked, the IDs live in memory for this page visit.

const KEY = "cart-reminders:carts";

type Saved = { current: string | null; all: string[] };

export type VisitorStore = {
  currentCartId(): string | null;
  getCartIds(): string[];
  setCurrent(id: string): void;
  startFresh(): void;
};

export function createVisitorStore(storage: Storage | undefined): VisitorStore {
  let memory: Saved = { current: null, all: [] };

  const read = (): Saved => {
    try {
      const raw = storage?.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw) as Saved;
        if (Array.isArray(v.all)) memory = { current: typeof v.current === "string" ? v.current : null, all: v.all.filter((x) => typeof x === "string") };
      }
    } catch {
      // blocked or junk: keep memory
    }
    return memory;
  };

  const write = (v: Saved) => {
    memory = v;
    try {
      storage?.setItem(KEY, JSON.stringify(v));
    } catch {
      // blocked: memory only
    }
  };

  return {
    currentCartId: () => read().current,
    getCartIds: () => read().all,
    setCurrent(id) {
      const v = read();
      write({ current: id, all: v.all.includes(id) ? v.all : [...v.all, id] });
    },
    startFresh() {
      write({ ...read(), current: null });
    },
  };
}

/** The browser's store, or a memory-only one when there is no window. */
export function browserVisitorStore(): VisitorStore {
  let storage: Storage | undefined;
  try {
    storage = typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    storage = undefined;
  }
  return createVisitorStore(storage);
}
