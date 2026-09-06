import { describe, it, expect } from "vitest";
import type { JournalEntry, ChatTurn, EntrySummaryResponse } from "@/types/journal";
import type { UserProfile } from "@/types/auth";

describe("Domain Types", () => {
  it("should validate JournalEntry structure", () => {
    const turn: ChatTurn = {
      id: "turn-1",
      role: "user",
      content: "Feeling overwhelmed today.",
      timestamp: Date.now()
    };
    const entry: JournalEntry = {
      id: "entry-1",
      userId: "user-123",
      title: "Morning Thoughts",
      content: "Initial journal content",
      summary: null,
      moodTags: ["anxious"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      turns: [turn]
    };
    expect(entry.turns.length).toBe(1);
    expect(entry.title).toBe("Morning Thoughts");
    expect(entry.summary).toBeNull();
  });

  it("should validate UserProfile structure", () => {
    const user: UserProfile = {
      uid: "user-123",
      email: "test@example.com",
      displayName: "Test User",
      photoURL: "https://example.com/photo.jpg"
    };
    expect(user.uid).toBe("user-123");
  });

  it("should validate EntrySummaryResponse structure", () => {
    const response: EntrySummaryResponse = {
      summary: "A reflective morning session on stress management.",
      keyInsights: ["Recognized pattern of overcommitment", "Desire for clearer boundaries"],
      suggestedTags: ["boundaries", "stress-management"]
    };
    expect(response.keyInsights.length).toBe(2);
  });
});
