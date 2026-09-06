import { describe, it, expect } from "vitest";
import { POST } from "@/app/api/journal/summarize/route";
import { NextRequest } from "next/server";

describe("POST /api/journal/summarize", () => {
  it("rejects unauthorized calls", async () => {
    const req = new NextRequest("http://localhost:3000/api/journal/summarize", {
      method: "POST",
      body: JSON.stringify({ content: "test" })
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });

  it("returns summary, key insights, and tags when authorized", async () => {
    const req = new NextRequest("http://localhost:3000/api/journal/summarize", {
      method: "POST",
      headers: {
        authorization: "Bearer mock-dev-token"
      },
      body: JSON.stringify({
        content: "I felt distracted today but managed to finish my primary task.",
        turns: []
      })
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    const data = await res.json();
    expect(data.summary).toBeDefined();
    expect(Array.isArray(data.keyInsights)).toBe(true);
    expect(Array.isArray(data.suggestedTags)).toBe(true);
  });
});