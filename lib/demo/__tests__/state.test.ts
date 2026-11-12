import { describe, expect, it } from "vitest";
import { INITIAL_STATE, REMINDER_HOURS, leave, markPaid, nextReminderAtMin, skipAhead, stateFromAttributes, stateToAttributes } from "../state";

describe("demo state", () => {
  it("reminds at 1 hour and 24 hours", () => {
    expect(REMINDER_HOURS).toEqual([1, 24]);
  });

  it("leaving marks the cart left at the current clock", () => {
    const s = leave({ ...INITIAL_STATE, clockMin: 30 }, "cs_1");
    expect(s).toMatchObject({ status: "left", leftAtMin: 30, sessionId: "cs_1" });
    expect(nextReminderAtMin(s)).toBe(90);
  });

  it("skip ahead gives the first reminder, then the second, then nothing", () => {
    const left = leave(INITIAL_STATE, "cs_1");
    const one = skipAhead(left);
    expect(one).toMatchObject({ status: "reminded-1", clockMin: 60 });
    const two = skipAhead(one);
    expect(two).toMatchObject({ status: "reminded-2", clockMin: 24 * 60 });
    expect(nextReminderAtMin(two)).toBeNull();
    expect(skipAhead(two)).toEqual(two);
  });

  it("skip ahead does nothing to a cart that is shopping or paid", () => {
    expect(skipAhead(INITIAL_STATE)).toEqual(INITIAL_STATE);
    const paid = markPaid(leave(INITIAL_STATE, "cs_1"), "#1001");
    expect(skipAhead(paid)).toEqual(paid);
  });

  it("paying after a reminder counts as won back", () => {
    const s = markPaid(skipAhead(leave(INITIAL_STATE, "cs_1")), "#1001");
    expect(s).toMatchObject({ status: "paid", wonBack: true, orderName: "#1001" });
  });

  it("paying without a reminder is not won back", () => {
    expect(markPaid(leave(INITIAL_STATE, "cs_1"), "#1002").wonBack).toBe(false);
    expect(markPaid(INITIAL_STATE, "#1003").wonBack).toBe(false);
  });

  it("round-trips through Shopify cart attributes with hidden keys", () => {
    const s = markPaid(skipAhead(leave({ ...INITIAL_STATE, clockMin: 5 }, "cs_9")), "#1009");
    const attrs = stateToAttributes(s);
    expect(attrs.every((a) => a.key.startsWith("_cr_"))).toBe(true);
    expect(stateFromAttributes(attrs)).toEqual(s);
  });

  it("reads missing or junk attributes as a fresh cart", () => {
    expect(stateFromAttributes([])).toEqual(INITIAL_STATE);
    expect(stateFromAttributes([{ key: "_cr_status", value: "nonsense" }, { key: "_cr_clock", value: "x" }])).toEqual(INITIAL_STATE);
  });
});
