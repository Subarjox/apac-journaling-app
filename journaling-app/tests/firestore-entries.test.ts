import { describe, it, expect, beforeEach } from "vitest";
import { 
  saveJournalEntry, 
  getJournalEntry, 
  getUserJournalEntries, 
  deleteJournalEntry 
} from "@/lib/firestore/entries";
import type { JournalEntry } from "@/types/journal";

describe("Firestore Entries Repository", () => {
  const userId = "test-user-456";
  const entry: JournalEntry = {
    id: "entry-abc",
    userId: userId,
    title: "Reflecting on Progress",
    content: "Today was productive despite initial hesitation.",
    summary: null,
    moodTags: ["productive", "calm"],
    createdAt: 1000,
    updatedAt: 1000,
    turns: []
  };

  it("saves and retrieves a journal entry", async () => {
    await saveJournalEntry(userId, entry);
    const retrieved = await getJournalEntry(userId, "entry-abc");
    expect(retrieved).not.toBeNull();
    expect(retrieved?.title).toBe("Reflecting on Progress");
  });

  it("retrieves all entries for a specific user ordered by createdAt", async () => {
    const olderEntry: JournalEntry = { ...entry, id: "entry-old", createdAt: 500 };
    await saveJournalEntry(userId, olderEntry);

    const entries = await getUserJournalEntries(userId);
    expect(entries.length).toBeGreaterThanOrEqual(2);
    expect(entries[0].createdAt).toBeGreaterThanOrEqual(entries[1].createdAt);
  });

  it("isolates entries so another user cannot see them", async () => {
    const otherEntries = await getUserJournalEntries("different-user-999");
    expect(otherEntries.length).toBe(0);
  });

  it("deletes a journal entry correctly", async () => {
    await deleteJournalEntry(userId, "entry-abc");
    const retrieved = await getJournalEntry(userId, "entry-abc");
    expect(retrieved).toBeNull();
  });
});
