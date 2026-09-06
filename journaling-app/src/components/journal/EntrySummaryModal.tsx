"use client";

import React from "react";
import type { EntrySummaryResponse } from "@/types/journal";
import { Button } from "@/components/ui/Button";
import { Sparkles, X, Check, Tag } from "lucide-react";

interface EntrySummaryModalProps {
  isOpen: boolean;
  onClose: () => void;
  summaryData: EntrySummaryResponse | null;
  onApplyTags: (tags: string[]) => void;
}

export function EntrySummaryModal({
  isOpen,
  onClose,
  summaryData,
  onApplyTags
}: EntrySummaryModalProps) {
  if (!isOpen || !summaryData) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-stone-900/40 backdrop-blur-xs p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full border border-stone-200 shadow-xl overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="p-5 border-b border-stone-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-stone-900 text-stone-100 flex items-center justify-center">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <span className="font-serif font-semibold text-stone-900 text-sm">Reflection Synthesis</span>
          </div>

          <button onClick={onClose} className="p-1 rounded-md text-stone-400 hover:text-stone-700">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div>
            <h4 className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-1.5">
              Distilled Summary
            </h4>
            <p className="font-serif text-sm text-stone-800 leading-relaxed bg-stone-50 p-3 rounded-lg border border-stone-100">
              {summaryData.summary}
            </p>
          </div>

          {summaryData.keyInsights.length > 0 && (
            <div>
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-1.5">
                Key Insights & Patterns
              </h4>
              <ul className="space-y-1.5">
                {summaryData.keyInsights.map((insight, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-xs text-stone-700 leading-relaxed">
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                    <span>{insight}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {summaryData.suggestedTags.length > 0 && (
            <div>
              <h4 className="text-[11px] uppercase tracking-wider font-semibold text-stone-400 mb-1.5">
                Suggested Tags
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {summaryData.suggestedTags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-stone-100 text-stone-700 text-xs"
                  >
                    <Tag className="w-2.5 h-2.5" /> #{tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="p-4 bg-stone-50/80 border-t border-stone-100 flex justify-end gap-2">
          {summaryData.suggestedTags.length > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                onApplyTags(summaryData.suggestedTags);
                onClose();
              }}
              className="text-xs"
            >
              Add Tags & Close
            </Button>
          )}

          <Button size="sm" onClick={onClose} className="text-xs">
            Done
          </Button>
        </div>
      </div>
    </div>
  );
}