import React from "react";
import Link from "next/link";
import { BookOpen, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-[#fbfbf9] text-[#1c1917]">
      <div className="max-w-md w-full text-center space-y-6">
        <div className="w-12 h-12 rounded-xl bg-stone-900 text-stone-100 flex items-center justify-center mx-auto shadow-xs">
          <BookOpen className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-stone-400">Error 404</span>
          <h1 className="font-serif text-3xl sm:text-4xl font-normal tracking-tight text-stone-900">
            Path not found
          </h1>
          <p className="text-sm text-stone-600 leading-relaxed max-w-sm mx-auto">
            This reflection does not exist in your sanctuary. Return to your journal to continue writing.
          </p>
        </div>

        <div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-stone-900 text-stone-50 hover:bg-stone-800 text-xs font-medium transition-colors shadow-xs"
          >
            <ArrowLeft className="w-4 h-4" /> Return to Sanctuary
          </Link>
        </div>
      </div>
    </div>
  );
}