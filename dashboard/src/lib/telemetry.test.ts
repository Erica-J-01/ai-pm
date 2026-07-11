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

  it("redacts a Bearer/Basic Authorization value", () => {
    expect(scrubSecrets("Authorization: Bearer abcdef0123456789TOKEN"))
      .toBe("Authorization: Bearer [redacted]");
    expect(scrubSecrets("Basic ZW1haWw6dG9rZW4tdmFsdWUtaGVyZQ=="))
      .toBe("Basic [redacted]");
  });

  it("does not redact the words Basic/Bearer in ordinary prose", () => {
    expect(scrubSecrets("Basic understanding of the API")).toBe("Basic understanding of the API");
    expect(scrubSecrets("Bearer of bad news")).toBe("Bearer of bad news");
  });

  it("passes undefined through", () => {
    expect(scrubSecrets(undefined)).toBeUndefined();
  });
});
