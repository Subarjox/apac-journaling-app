import { describe, it, expect } from "vitest";
import { parseBearerToken } from "@/lib/firebase/admin";

describe("Auth Server Helpers", () => {
  it("extracts token from authorization header correctly", () => {
    const token = parseBearerToken("Bearer sample-token-xyz");
    expect(token).toBe("sample-token-xyz");
  });

  it("returns null for malformed authorization header", () => {
    expect(parseBearerToken("Basic xyz")).toBeNull();
    expect(parseBearerToken("")).toBeNull();
    expect(parseBearerToken(null)).toBeNull();
  });
});
