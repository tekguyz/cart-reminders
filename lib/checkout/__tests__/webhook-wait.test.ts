import { describe, expect, it } from "vitest";
import { WEBHOOK_WAIT_SECONDS, webhookMayComplete } from "../webhook-wait";

describe("webhook backup path", () => {
  it("leaves a fresh payment to the page, so two servers never write two orders", () => {
    expect(webhookMayComplete(1_000, 1_000 + WEBHOOK_WAIT_SECONDS - 1)).toBe(false);
  });
  it("writes the order once the page has had its chance", () => {
    expect(webhookMayComplete(1_000, 1_000 + WEBHOOK_WAIT_SECONDS)).toBe(true);
  });
});
