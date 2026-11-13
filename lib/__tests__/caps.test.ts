import { describe, expect, it } from "vitest";
import { ORDERS_PER_HOUR, SESSIONS_PER_HOUR, overCap } from "../caps";

describe("caps", () => {
  it("allows up to the cap and refuses past it", () => {
    expect(overCap(SESSIONS_PER_HOUR - 1, SESSIONS_PER_HOUR)).toBe(false);
    expect(overCap(SESSIONS_PER_HOUR, SESSIONS_PER_HOUR)).toBe(true);
    expect(ORDERS_PER_HOUR).toBeLessThanOrEqual(SESSIONS_PER_HOUR);
  });
});
