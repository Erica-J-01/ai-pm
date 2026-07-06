import { describe, it, expect } from "vitest";
import { scrubSecrets } from "@/lib/telemetry";

describe("scrubSecrets (telemetry secret redaction)", () => {
  it("redacts an Anthropic key inside a message", () => {
    expect(scrubSecrets("failed with key sk-ant-api03-abc123_XYZ-def"))
      .toBe("failed with key sk-ant-[redacted]");
  });

  it("redacts every key when more than one is present", () => {
    const out = scrubSecrets("sk-ant-aaaAAA and sk-ant-bbbBBB");
    expect(out).not.toContain("aaaAAA");
    expect(out).not.toContain("bbbBBB");
  });

  it("leaves ordinary text untouched", () => {
    expect(scrubSecrets("nothing secret here")).toBe("nothing secret here");
  });

  it("passes undefined through", () => {
    expect(scrubSecrets(undefined)).toBeUndefined();
  });
});
