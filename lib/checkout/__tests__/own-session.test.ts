import { describe, expect, it } from "vitest";
import { isOwnSession } from "../own-session";

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
