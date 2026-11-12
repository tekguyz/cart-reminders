import { describe, expect, it } from "vitest";
import { ownerNumbers } from "../owner";
import { SAMPLE_HISTORY } from "../sample-history";

describe("owner numbers", () => {
  it("adds the visitor's own carts to the sample history", () => {
    const base = ownerNumbers(SAMPLE_HISTORY, []);
    const mine = ownerNumbers(SAMPLE_HISTORY, [
      { status: "paid", wonBack: true, reminded: true },
      { status: "left", wonBack: false, reminded: false },
    ]);
    expect(mine.started).toBe(base.started + 2);
    expect(mine.left).toBe(base.left + 2);
    expect(mine.reminded).toBe(base.reminded + 1);
    expect(mine.wonBack).toBe(base.wonBack + 1);
    expect(mine.orders).toBe(base.orders + 1);
  });
  it("counts a cart that was paid without leaving as started and ordered only", () => {
    const n = ownerNumbers([], [{ status: "paid", wonBack: false, reminded: false, everLeft: false }]);
    expect(n).toEqual({ started: 1, left: 0, reminded: 0, wonBack: 0, orders: 1 });
  });
});
