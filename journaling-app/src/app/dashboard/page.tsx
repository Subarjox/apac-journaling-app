"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Sidebar } from "@/components/dashboard/Sidebar";
import { EntryEditor } from "@/components/journal/EntryEditor";
import { ReflectionStream } from "@/components/journal/ReflectionStream";
import { EntrySummaryModal } from "@/components/journal/EntrySummaryModal";
import { 
  getUserJournalEntries, 
  saveJournalEntry 
} from "@/lib/firestore/entries";
import type { JournalEntry, ChatTurn, EntrySummaryResponse } from "@/types/journal";
import { MessageSquare, Edit3 } from "lucide-react";

export default function DashboardPage() {
  const { user, loading, getIdToken } = useAuth();
  const { showError, showSuccess } = useToast();
  const router = useRouter();

  const [entries, setEntries] = useState<JournalEntry[]>([]);
  const [activeEntry, setActiveEntry] = useState<JournalEntry | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [isSynthesizing, setIsSynthesizing] = useState(false);
  const [summaryData, setSummaryData] = useState<EntrySummaryResponse | null>(null);
  const [isSummaryModalOpen, setIsSummaryModalOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"editor" | "reflection">("editor");

  const createBlankEntry = useCallback((uid: string): JournalEntry => {
    return {
      id: `entry-${Date.now()}`,
      userId: uid,
      title: "Untitled Reflection",
      content: "",
      summary: null,
      moodTags: ["calm"],
      createdAt: Date.now(),
      updatedAt: Date.now(),
      turns: []
    };
  }, []);

  const loadEntries = useCallback(async (uid: string) => {
    try {
      const userEntries = await getUserJournalEntries(uid);
      setEntries(userEntries);
      if (userEntries.length > 0) {
        setActiveEntry(userEntries[0]);
      } else {
        setActiveEntry(createBlankEntry(uid));
      }
    } catch (err) {
      console.error("Failed to load user entries:", err);
      showError("Failed to fetch past journal entries from database.", "Database Error");
    }
  }, [createBlankEntry, showError]);

  useEffect(() => {
    if (!loading && !user) {
      router.replace("/");
      return;
    }
    if (user) {
      loadEntries(user.uid);
    }
  }, [loading, user, router, loadEntries]);

  const handleSelectEntry = (entry: JournalEntry) => {
    setActiveEntry(entry);
  };

  const handleNewEntry = () => {
    if (!user) return;
    const fresh = createBlankEntry(user.uid);
    setActiveEntry(fresh);
    setEntries((prev) => [fresh, ...prev]);
  };

  const handleSaveEntry = async () => {
    if (!activeEntry || !user) return;
    setIsSaving(true);
    try {
      await saveJournalEntry(user.uid, activeEntry);
      setEntries((prev) => {
        const index = prev.findIndex((e) => e.id === activeEntry.id);
        if (index >= 0) {
          const clone = [...prev];
          clone[index] = activeEntry;
          return clone;
        }
        return [activeEntry, ...prev];
      });
      showSuccess("Your reflection has been safely recorded.", "Entry Saved");
    } catch (err) {
      console.error("Save entry failed:", err);
      showError("Unable to save entry to Firestore. Please check your connection.", "Save Failed");
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddTurn = async (turn: ChatTurn) => {
    if (!activeEntry || !user) return;
    const updatedEntry: JournalEntry = {
      ...activeEntry,
      turns: [...activeEntry.turns, turn],
      updatedAt: Date.now()
    };
    setActiveEntry(updatedEntry);
    try {
      await saveJournalEntry(user.uid, updatedEntry);
    } catch (err) {
      console.error("Auto-saving turn failed:", err);
    }
  };

  const handleSynthesize = async () => {
    if (!activeEntry || !user) return;
    setIsSynthesizing(true);
    try {
      const token = await getIdToken();
      if (!token) throw new Error("Authentication token missing");

      const res = await fetch("/api/journal/summarize", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          content: activeEntry.content,
          turns: activeEntry.turns
        })
      });

      if (!res.ok) throw new Error("Synthesis failed");
      const result: EntrySummaryResponse = await res.json();
      setSummaryData(result);
      setIsSummaryModalOpen(true);

      const updatedWithSummary = {
        ...activeEntry,
        summary: result.summary,
        updatedAt: Date.now()
      };
      setActiveEntry(updatedWithSummary);
      await saveJournalEntry(user.uid, updatedWithSummary);
      showSuccess("Gemini successfully extracted key patterns and takeaways.", "Reflection Synthesized");
    } catch (err) {
      console.error("Synthesize error:", err);
      showError("Gemini was unable to synthesize the session. Please check your network and try again.", "Synthesis Error");
    } finally {
      setIsSynthesizing(false);
    }
  };

  const handleApplyTags = async (tags: string[]) => {
    if (!activeEntry || !user) return;
    const uniqueTags = Array.from(new Set([...activeEntry.moodTags, ...tags]));
    const updated = { ...activeEntry, moodTags: uniqueTags };
    setActiveEntry(updated);
    await saveJournalEntry(user.uid, updated);
  };

  if (loading || !user) {
    return (
      <div className="h-screen flex items-center justify-center bg-[#fbfbf9]">
        <div className="text-center font-serif text-stone-500 animate-pulse text-sm">
          {!user ? "Verifying authentication..." : "Loading your reflection sanctuary..."}
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col md:flex-row overflow-hidden bg-[#fbfbf9]">
      <Sidebar
        entries={entries}
        activeEntryId={activeEntry?.id || null}
        onSelectEntry={handleSelectEntry}
        onNewEntry={handleNewEntry}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
      />

      <div className="flex-1 flex flex-col h-full overflow-hidden p-3 sm:p-5">
        <div className="flex md:hidden items-center justify-center gap-2 mb-3 bg-stone-200/60 p-1 rounded-lg">
          <button
            onClick={() => setActiveTab("editor")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 ${
              activeTab === "editor" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-600"
            }`}
          >
            <Edit3 className="w-3.5 h-3.5" /> Journal Canvas
          </button>
          <button
            onClick={() => setActiveTab("reflection")}
            className={`flex-1 py-1.5 text-xs font-medium rounded-md flex items-center justify-center gap-1.5 ${
              activeTab === "reflection" ? "bg-white text-stone-900 shadow-2xs" : "text-stone-600"
            }`}
          >
            <MessageSquare className="w-3.5 h-3.5" /> Reflection Chat
          </button>
        </div>

        <div className="flex-1 grid grid-cols-1 md:grid-cols-12 gap-4 h-full overflow-hidden">
          <div
            className={`h-full md:col-span-7 flex flex-col overflow-hidden ${
              activeTab === "editor" ? "flex" : "hidden md:flex"
            }`}
          >
            {activeEntry ? (
              <EntryEditor
                entry={activeEntry}
                onUpdateEntry={setActiveEntry}
                onSave={handleSaveEntry}
                isSaving={isSaving}
                onSynthesize={handleSynthesize}
                isSynthesizing={isSynthesizing}
              />
            ) : (
              <div className="h-full flex items-center justify-center bg-white rounded-xl border border-stone-200 text-stone-400 font-serif text-sm">
                Select or create an entry to begin writing.
              </div>
            )}
          </div>

          <div
            className={`h-full md:col-span-5 flex flex-col overflow-hidden ${
              activeTab === "reflection" ? "flex" : "hidden md:flex"
            }`}
          >
            {activeEntry && (
              <ReflectionStream
                turns={activeEntry.turns}
                onAddTurn={handleAddTurn}
                entryContent={activeEntry.content}
              />
            )}
          </div>
        </div>
      </div>

      <EntrySummaryModal
        isOpen={isSummaryModalOpen}
        onClose={() => setIsSummaryModalOpen(false)}
        summaryData={summaryData}
        onApplyTags={handleApplyTags}
      />
    </div>
  );
}