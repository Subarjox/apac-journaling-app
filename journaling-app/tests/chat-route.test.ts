import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/journal/chat/route";
import { NextRequest } from "next/server";

describe("POST /api/journal/chat", () => {
  it("rejects unauthorized requests with 401", async () => {
    const req = new NextRequest("http://localhost:3000/api/journal/chat", {
      method: "POST",
      body: JSON.stringify({ prompt: "Hello" })
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("streams response when authorized with mock token", async () => {
    const req = new NextRequest("http://localhost:3000/api/journal/chat", {
      method: "POST",
      headers: {
        authorization: "Bearer mock-dev-token"
      },
      body: JSON.stringify({
        prompt: "I am trying to find focus in my day.",
        history: []
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    expect(res.headers.get("content-type")).toContain("text/plain");

    const reader = res.body?.getReader();
    expect(reader).toBeDefined();
    if (reader) {
      const { value, done } = await reader.read();
      expect(done).toBe(false);
      const decoded = new TextDecoder().decode(value);
      expect(decoded.length).toBeGreaterThan(0);
    }
  });
});