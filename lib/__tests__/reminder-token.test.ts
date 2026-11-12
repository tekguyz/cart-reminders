import { describe, expect, it } from "vitest";
import { signCartToken, verifyCartToken } from "../reminder-token";

const cartId = "gid://shopify/Cart/hWN2abc?key=123";

describe("reminder link token", () => {
  it("round-trips a cart ID", () => {
    expect(verifyCartToken(signCartToken(cartId, "s3cret"), "s3cret")).toBe(cartId);
  });
  it("refuses an edited token", () => {
    const t = signCartToken(cartId, "s3cret");
    const edited = (t[0] === "a" ? "b" : "a") + t.slice(1);
    expect(verifyCartToken(edited, "s3cret")).toBeNull();
  });
  it("refuses the wrong secret", () => {
    expect(verifyCartToken(signCartToken(cartId, "s3cret"), "other")).toBeNull();
  });
  it("refuses junk", () => {
    expect(verifyCartToken("not-a-token", "s3cret")).toBeNull();
    expect(verifyCartToken("", "s3cret")).toBeNull();
  });
  it("is safe in a URL path", () => {
    expect(signCartToken(cartId, "s3cret")).toMatch(/^[A-Za-z0-9_.-]+$/);
  });
});
