"use client";

import React, { useState } from "react";
import type { JournalEntry } from "@/types/journal";
import { Button } from "@/components/ui/Button";
import { Save, Tag, Sparkles } from "lucide-react";

interface EntryEditorProps {
  entry: JournalEntry;
  onUpdateEntry: (updated: JournalEntry) => void;
  onSave: () => void;
  isSaving: boolean;
  onSynthesize: () => void;
  isSynthesizing: boolean;
}

const AVAILABLE_TAGS = ["anxious", "calm", "overwhelmed", "grateful", "focused", "hopeful", "tired", "inspired"];

export function EntryEditor({
  entry,
  onUpdateEntry,
  onSave,
  isSaving,
  onSynthesize,
  isSynthesizing
}: EntryEditorProps) {
  const [newTag, setNewTag] = useState("");

  const toggleTag = (tag: string) => {
    const exists = entry.moodTags.includes(tag);
    const updatedTags = exists
      ? entry.moodTags.filter((t) => t !== tag)
      : [...entry.moodTags, tag];
    onUpdateEntry({ ...entry, moodTags: updatedTags });
  };

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && newTag.trim()) {
      e.preventDefault();
      const cleaned = newTag.trim().toLowerCase().replace(/^#/, "");
      if (!entry.moodTags.includes(cleaned)) {
        onUpdateEntry({ ...entry, moodTags: [...entry.moodTags, cleaned] });
      }
      setNewTag("");
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Top Header */}
      <div className="p-4 sm:p-6 border-b border-stone-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <input
          type="text"
          value={entry.title}
          placeholder="Give your reflection a title..."
          onChange={(e) => onUpdateEntry({ ...entry, title: e.target.value })}
          className="font-serif text-xl sm:text-2xl font-semibold text-stone-900 placeholder:text-stone-300 w-full focus:outline-none"
        />

        <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
          <Button
            variant="outline"
            size="sm"
            onClick={onSynthesize}
            isLoading={isSynthesizing}
            className="text-xs gap-1.5 border-stone-300"
          >
            <Sparkles className="w-3.5 h-3.5 text-stone-600" />
            Synthesize
          </Button>

          <Button
            size="sm"
            onClick={onSave}
            isLoading={isSaving}
            className="text-xs gap-1.5"
          >
            <Save className="w-3.5 h-3.5" />
            Save Entry
          </Button>
        </div>
      </div>

      {/* Mood Tags Bar */}
      <div className="px-4 sm:px-6 py-2.5 bg-stone-50/50 border-b border-stone-100 flex flex-wrap items-center gap-1.5">
        <span className="text-[11px] font-medium text-stone-400 flex items-center gap-1 mr-1">
          <Tag className="w-3 h-3" /> State:
        </span>
        {AVAILABLE_TAGS.map((tag) => {
          const isSelected = entry.moodTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`text-[11px] px-2 py-0.5 rounded-full transition-colors cursor-pointer ${
                isSelected
                  ? "bg-stone-800 text-stone-50 font-medium"
                  : "bg-stone-200/70 text-stone-600 hover:bg-stone-200"
              }`}
            >
              #{tag}
            </button>
          );
        })}

        <input
          type="text"
          placeholder="+ tag..."
          value={newTag}
          onChange={(e) => setNewTag(e.target.value)}
          onKeyDown={handleAddCustomTag}
          className="text-[11px] bg-transparent border-none text-stone-700 placeholder:text-stone-400 focus:outline-none w-16"
        />
      </div>

      {/* Writing Area */}
      <div className="flex-1 p-4 sm:p-6">
        <textarea
          value={entry.content}
          onChange={(e) => onUpdateEntry({ ...entry, content: e.target.value })}
          placeholder="Pour out your unfiltered thoughts here. What is on your mind today?"
          className="w-full h-full resize-none font-serif text-base text-stone-800 placeholder:text-stone-300 leading-relaxed focus:outline-none"
        />
      </div>
    </div>
  );
}