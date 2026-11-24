import { describe, expect, it } from "vitest";
import { countCapped, countsTowardCap, isOwnSession } from "../own-session";

describe("isOwnSession", () => {
  it.each([
    [undefined, true],
    [null, true],
    [{}, true],
    [{ app: "cart-reminders" }, true],
    [{ app: "coquimba" }, false],
  ])("isOwnSession(%j) is %s", (m, want) => {
    expect(isOwnSession(m as Record<string, string> | null | undefined)).toBe(want);
  });
});

describe("session cap count", () => {
  it("counts only our sessions opened for a cart", () => {
    expect(countsTowardCap({ cart_id: "c", app: "cart-reminders" })).toBe(true);
    expect(countsTowardCap({ cart_id: "c" })).toBe(true);
    expect(countsTowardCap({ cart_id: "c", app: "coquimba" })).toBe(false);
    expect(countsTowardCap({})).toBe(false);
    expect(countsTowardCap(null)).toBe(false);
  });

  it("skips Coquimba's sessions and stops paging at the max", async () => {
    let read = 0;
    async function* sessions() {
      for (let i = 0; i < 1000; i++) {
        read++;
        yield { metadata: i % 2 ? { cart_id: "c", app: "coquimba" } : { cart_id: "c", app: "cart-reminders" } };
      }
    }
    expect(await countCapped(sessions(), 61)).toBe(61);
    expect(read).toBe(121);
  });
});
