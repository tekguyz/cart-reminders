import { describe, expect, it } from "vitest";
import { clockLabel, untilLabel } from "../clock";

describe("demo clock words", () => {
  it("starts on Tuesday at 2:00 pm", () => expect(clockLabel(0)).toBe("Tue 2:00 pm"));
  it("moves an hour", () => expect(clockLabel(60)).toBe("Tue 3:00 pm"));
  it("crosses midnight and noon", () => {
    expect(clockLabel(10 * 60)).toBe("Wed 12:00 am");
    expect(clockLabel(22 * 60 + 5)).toBe("Wed 12:05 pm");
  });
  it("says how long until the next reminder", () => {
    expect(untilLabel(0, 60)).toBe("in 1 hour");
    expect(untilLabel(60, 24 * 60)).toBe("in 23 hours");
  });
});
