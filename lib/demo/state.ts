// The cart's demo state, and every rule about reminders. Pure: no clock, no
// network. The server keeps this on the Shopify cart as attributes (ADR 0002).

export type CartStatus = "shopping" | "left" | "reminded-1" | "reminded-2" | "paid";

export type DemoState = {
  status: CartStatus;
  /** Demo-clock minute the shopper left checkout. */
  leftAtMin: number | null;
  /** The demo clock, in minutes since the cart was made. */
  clockMin: number;
  sessionId: string | null;
  /** Paid after at least one reminder. */
  wonBack: boolean;
  /** Ever left at checkout, even if later paid. */
  everLeft: boolean;
  orderName: string | null;
  /** Stripe's own recovery link for the left checkout, when it made one. */
  recoveryUrl: string | null;
};

export const INITIAL_STATE: DemoState = {
  status: "shopping",
  leftAtMin: null,
  clockMin: 0,
  sessionId: null,
  wonBack: false,
  everLeft: false,
  orderName: null,
  recoveryUrl: null,
};

/** Hours after leaving that each reminder goes out. Then it stops. */
export const REMINDER_HOURS = [1, 24] as const;

const STATUSES: CartStatus[] = ["shopping", "left", "reminded-1", "reminded-2", "paid"];

export function remindersSent(s: DemoState): number {
  return s.status === "reminded-1" ? 1 : s.status === "reminded-2" ? 2 : 0;
}

export function leave(s: DemoState, sessionId: string, recoveryUrl: string | null = null): DemoState {
  if (s.status === "paid") return s;
  return { ...s, status: "left", leftAtMin: s.clockMin, sessionId, everLeft: true, recoveryUrl };
}

/** The demo-clock minute the next reminder is due, or null when none is left. */
export function nextReminderAtMin(s: DemoState): number | null {
  if (s.leftAtMin === null || s.status === "paid" || s.status === "shopping") return null;
  const hours = REMINDER_HOURS[remindersSent(s)];
  return hours === undefined ? null : s.leftAtMin + hours * 60;
}

/** Moves the clock to the next reminder and sends it (on screen only). */
export function skipAhead(s: DemoState): DemoState {
  const due = nextReminderAtMin(s);
  if (due === null) return s;
  const next: CartStatus = remindersSent(s) === 0 ? "reminded-1" : "reminded-2";
  return { ...s, status: next, clockMin: Math.max(s.clockMin, due) };
}

export function markPaid(s: DemoState, orderName: string): DemoState {
  if (s.status === "paid") return s;
  return { ...s, status: "paid", wonBack: remindersSent(s) > 0, orderName };
}

type Attr = { key: string; value: string };

export function stateToAttributes(s: DemoState): Attr[] {
  return [
    { key: "_cr_status", value: s.status },
    { key: "_cr_left", value: s.leftAtMin === null ? "" : String(s.leftAtMin) },
    { key: "_cr_clock", value: String(s.clockMin) },
    { key: "_cr_session", value: s.sessionId ?? "" },
    { key: "_cr_won", value: s.wonBack ? "1" : "" },
    { key: "_cr_ever_left", value: s.everLeft ? "1" : "" },
    { key: "_cr_order", value: s.orderName ?? "" },
    { key: "_cr_recovery", value: s.recoveryUrl ?? "" },
  ];
}

export function stateFromAttributes(attrs: Attr[]): DemoState {
  const get = (k: string) => attrs.find((a) => a.key === k)?.value ?? "";
  const status = get("_cr_status") as CartStatus;
  if (!STATUSES.includes(status)) return INITIAL_STATE;
  const num = (v: string) => (v !== "" && Number.isFinite(Number(v)) ? Number(v) : null);
  return {
    status,
    leftAtMin: num(get("_cr_left")),
    clockMin: num(get("_cr_clock")) ?? 0,
    sessionId: get("_cr_session") || null,
    wonBack: get("_cr_won") === "1",
    everLeft: get("_cr_ever_left") === "1",
    orderName: get("_cr_order") || null,
    recoveryUrl: get("_cr_recovery") || null,
  };
}
