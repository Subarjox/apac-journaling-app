"use client";

import React from "react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/Button";
import type { JournalEntry } from "@/types/journal";
import { Plus, LogOut, BookOpen, Search, Calendar } from "lucide-react";

interface SidebarProps {
  entries: JournalEntry[];
  activeEntryId: string | null;
  onSelectEntry: (entry: JournalEntry) => void;
  onNewEntry: () => void;
  searchQuery: string;
  onSearchChange: (q: string) => void;
}

export function Sidebar({
  entries,
  activeEntryId,
  onSelectEntry,
  onNewEntry,
  searchQuery,
  onSearchChange
}: SidebarProps) {
  const { user, signOutUser } = useAuth();

  const filteredEntries = entries.filter((e) =>
    e.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
    e.moodTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <aside className="w-full md:w-80 h-full border-r border-stone-200 bg-stone-50/60 flex flex-col justify-between">
      {/* Top Header */}
      <div className="p-4 border-b border-stone-200">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-md bg-stone-900 flex items-center justify-center text-white">
              <BookOpen className="w-4 h-4" />
            </div>
            <span className="font-serif font-semibold text-stone-900 tracking-tight">Reflect</span>
          </div>

          <Button size="sm" onClick={onNewEntry} className="h-8 gap-1 px-2.5">
            <Plus className="w-3.5 h-3.5" /> New Entry
          </Button>
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            placeholder="Search reflections..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="w-full rounded-md border border-stone-200 bg-white pl-8 pr-3 py-1.5 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
          />
        </div>
      </div>

      {/* Entries List */}
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {filteredEntries.length === 0 ? (
          <div className="p-6 text-center text-xs text-stone-400">
            {searchQuery ? "No matching entries found." : "No reflections recorded yet."}
          </div>
        ) : (
          filteredEntries.map((entry) => {
            const isActive = entry.id === activeEntryId;
            const dateStr = new Date(entry.createdAt).toLocaleDateString(undefined, {
              month: "short",
              day: "numeric"
            });

            return (
              <button
                key={entry.id}
                onClick={() => onSelectEntry(entry)}
                className={`w-full text-left p-3 rounded-lg transition-colors text-xs flex flex-col gap-1 cursor-pointer ${
                  isActive
                    ? "bg-stone-200/70 text-stone-900 font-medium"
                    : "text-stone-700 hover:bg-stone-100"
                }`}
              >
                <div className="flex items-center justify-between w-full">
                  <span className="truncate font-serif text-sm text-stone-900">
                    {entry.title || "Untitled Reflection"}
                  </span>
                  <span className="text-[10px] text-stone-400 flex items-center gap-0.5">
                    <Calendar className="w-2.5 h-2.5" />
                    {dateStr}
                  </span>
                </div>

                <p className="line-clamp-2 text-stone-500 text-[11px] leading-relaxed">
                  {entry.content || "Empty reflection..."}
                </p>

                {entry.moodTags.length > 0 && (
                  <div className="flex items-center gap-1 mt-1 overflow-hidden">
                    {entry.moodTags.map((tag) => (
                      <span
                        key={tag}
                        className="px-1.5 py-0.5 rounded bg-stone-200/80 text-[10px] text-stone-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                )}
              </button>
            );
          })
        )}
      </div>

      {/* User Footer */}
      <div className="p-3 border-t border-stone-200 bg-white/70 flex items-center justify-between">
        <div className="flex items-center gap-2 overflow-hidden">
          <div className="w-7 h-7 rounded-full bg-stone-300 flex items-center justify-center text-xs font-serif text-stone-700 font-bold shrink-0">
            {user?.displayName ? user.displayName[0].toUpperCase() : "U"}
          </div>
          <div className="flex flex-col truncate">
            <span className="text-xs font-medium text-stone-900 truncate">
              {user?.displayName || "Reflector"}
            </span>
            <span className="text-[10px] text-stone-500 truncate">
              {user?.email || "dev@example.com"}
            </span>
          </div>
        </div>

        <button
          onClick={signOutUser}
          title="Sign Out"
          className="p-1.5 rounded-md hover:bg-stone-100 text-stone-500 hover:text-stone-800 transition-colors"
        >
          <LogOut className="w-4 h-4" />
        </button>
      </div>
    </aside>
  );
}