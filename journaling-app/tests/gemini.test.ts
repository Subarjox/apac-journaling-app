import { describe, it, expect } from "vitest";
import { streamReflectionChat, generateEntrySummary, DEFAULT_SYSTEM_INSTRUCTION } from "@/lib/gemini/service";
import type { ChatTurn } from "@/types/journal";

describe("Gemini Reflection Service", () => {
  it("exports a non-empty system instruction", () => {
    expect(DEFAULT_SYSTEM_INSTRUCTION.length).toBeGreaterThan(100);
    expect(DEFAULT_SYSTEM_INSTRUCTION).toContain("journaling companion");
  });

  it("yields streamed reflection chunks in mock mode when key is absent", async () => {
    const history: ChatTurn[] = [];
    const stream = await streamReflectionChat(history, "I am feeling conflicted about my career choices.");
    
    const chunks: string[] = [];
    for await (const chunk of stream) {
      chunks.push(chunk);
    }
    const fullText = chunks.join("");
    expect(fullText.length).toBeGreaterThan(20);
    expect(chunks.length).toBeGreaterThan(1);
  });

  it("generates a structured entry summary in mock mode", async () => {
    const history: ChatTurn[] = [
      { id: "1", role: "user", content: "Work was overwhelming today.", timestamp: Date.now() },
      { id: "2", role: "model", content: "What made it especially heavy?", timestamp: Date.now() }
    ];
    const summary = await generateEntrySummary("Work was overwhelming today.", history);
    expect(summary.summary).toBeDefined();
    expect(Array.isArray(summary.keyInsights)).toBe(true);
    expect(Array.isArray(summary.suggestedTags)).toBe(true);
  });
});
