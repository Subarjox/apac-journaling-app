"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { ChatTurn } from "@/types/journal";
import { Button } from "@/components/ui/Button";
import { Send, Bot, User, Sparkles, ArrowRightLeft } from "lucide-react";

interface ReflectionStreamProps {
  turns: ChatTurn[];
  onAddTurn: (turn: ChatTurn) => void;
  entryContent: string;
  onTransferToJournal?: () => void;
  isTransferring?: boolean;
}

export function ReflectionStream({
  turns,
  onAddTurn,
  entryContent,
  onTransferToJournal,
  isTransferring = false
}: ReflectionStreamProps) {
  const { getIdToken } = useAuth();
  const [localTurns, setLocalTurns] = useState<ChatTurn[]>(turns);
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Sync turns whenever parent turns change (e.g. entry switched or loaded from DB)
  useEffect(() => {
    setLocalTurns((prev) => {
      const turnMap = new Map<string, ChatTurn>();
      prev.forEach((t) => turnMap.set(t.id, t));
      turns.forEach((t) => turnMap.set(t.id, t));
      return Array.from(turnMap.values()).sort((a, b) => a.timestamp - b.timestamp);
    });
  }, [turns]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [localTurns, streamingContent]);

  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;

    const userText = input.trim();
    setInput("");

    const userTurn: ChatTurn = {
      id: `turn-${Date.now()}-user`,
      role: "user",
      content: userText,
      timestamp: Date.now()
    };

    // Optimistically update local turns immediately so chat bubble never disappears
    setLocalTurns((prev) => [...prev, userTurn]);
    onAddTurn(userTurn);

    setIsStreaming(true);
    setStreamingContent("");

    try {
      const token = (await getIdToken()) || "mock-dev-token";
      
      const response = await fetch("/api/journal/chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          prompt: userText,
          history: [...localTurns, userTurn]
        })
      });

      if (!response.ok) {
        throw new Error(`Chat error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullModelText = "";

      if (reader) {
        while (true) {
          const { value, done } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          fullModelText += chunk;
          setStreamingContent(fullModelText);
        }
      }

      const modelTurn: ChatTurn = {
        id: `turn-${Date.now()}-model`,
        role: "model",
        content: fullModelText,
        timestamp: Date.now()
      };
      setLocalTurns((prev) => [...prev, modelTurn]);
      onAddTurn(modelTurn);
    } catch (err) {
      console.error("Reflection chat failed:", err);
      const errorTurn: ChatTurn = {
        id: `turn-${Date.now()}-model`,
        role: "model",
        content: "I ran into a problem connecting to reflection services. Please check your network or try again.",
        timestamp: Date.now()
      };
      setLocalTurns((prev) => [...prev, errorTurn]);
      onAddTurn(errorTurn);
    } finally {
      setIsStreaming(false);
      setStreamingContent("");
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="flex flex-col h-full bg-stone-50/70 rounded-xl border border-stone-200 shadow-xs overflow-hidden">
      {/* Header */}
      <div className="p-3.5 sm:p-4 border-b border-stone-200/80 bg-white flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-stone-700" />
          <span className="font-serif text-sm font-semibold text-stone-900">
            Gemini Reflection Partner
          </span>
        </div>

        <div className="flex items-center gap-2">
          {onTransferToJournal && (
            <Button
              variant="outline"
              size="sm"
              onClick={onTransferToJournal}
              isLoading={isTransferring}
              disabled={localTurns.length === 0 || isStreaming || isTransferring}
              className="text-xs gap-1.5 h-7 px-2.5 bg-white border-stone-300 text-stone-700 hover:bg-stone-50 shadow-2xs"
              title="Transfer reflection summary and latest conclusions directly into your journal editor"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-stone-600" />
              <span className="hidden sm:inline">Transfer to Journal</span>
              <span className="sm:hidden">Transfer</span>
            </Button>
          )}
        </div>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {localTurns.length === 0 && !isStreaming ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full text-stone-400">
            <Bot className="w-8 h-8 mb-2 opacity-50 text-stone-500" />
            <p className="text-xs max-w-xs leading-relaxed">
              Write an initial entry, or ask Gemini to reflect on what you have written so far.
            </p>
          </div>
        ) : (
          <>
            {localTurns.map((turn) => {
              const isUser = turn.role === "user";
              return (
                <div
                  key={turn.id}
                  className={`flex gap-3 text-xs leading-relaxed ${
                    isUser ? "justify-end" : "justify-start"
                  }`}
                >
                  {!isUser && (
                    <div className="w-6 h-6 rounded-full bg-stone-800 text-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div
                    className={`p-3.5 rounded-xl max-w-[85%] sm:max-w-[75%] ${
                      isUser
                        ? "bg-stone-900 text-stone-50 rounded-tr-xs"
                        : "bg-white border border-stone-200 text-stone-800 rounded-tl-xs shadow-2xs font-serif"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{turn.content}</p>
                  </div>

                  {isUser && (
                    <div className="w-6 h-6 rounded-full bg-stone-300 text-stone-700 flex items-center justify-center shrink-0 mt-0.5">
                      <User className="w-3.5 h-3.5" />
                    </div>
                  )}
                </div>
              );
            })}

            {isStreaming && streamingContent && (
              <div className="flex gap-3 text-xs leading-relaxed justify-start">
                <div className="w-6 h-6 rounded-full bg-stone-800 text-stone-100 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot className="w-3.5 h-3.5" />
                </div>
                <div className="p-3.5 rounded-xl max-w-[85%] sm:max-w-[75%] bg-white border border-stone-200 text-stone-800 rounded-tl-xs shadow-2xs font-serif">
                  <p className="whitespace-pre-wrap">{streamingContent}</p>
                  <span className="inline-block w-1.5 h-3.5 bg-stone-500 animate-pulse ml-0.5 align-middle" />
                </div>
              </div>
            )}

            {localTurns.length >= 2 && !isStreaming && onTransferToJournal && (
              <div className="p-3 rounded-lg border border-stone-200 bg-white text-center shadow-2xs my-3">
                <p className="text-xs text-stone-600 mb-2">
                  Ready to turn this conversation into your journal entry?
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onTransferToJournal}
                  isLoading={isTransferring}
                  disabled={isStreaming || isTransferring}
                  className="text-xs gap-1.5 h-7 px-3 bg-stone-900 text-white hover:bg-stone-800 border-none mx-auto"
                >
                  <ArrowRightLeft className="w-3.5 h-3.5 text-stone-300" />
                  <span>Transfer Reflection to Journal</span>
                </Button>
              </div>
            )}

            <div ref={messagesEndRef} />
          </>
        )}
      </div>

      {/* Input Tray */}
      <div className="p-3 bg-white border-t border-stone-200 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask a reflective question or unpack a feeling..."
          rows={2}
          disabled={isStreaming}
          className="flex-1 resize-none rounded-lg border border-stone-200 bg-stone-50 p-2 text-xs text-stone-800 placeholder:text-stone-400 focus:outline-none focus:ring-1 focus:ring-stone-400"
        />

        <Button
          size="sm"
          onClick={handleSend}
          isLoading={isStreaming}
          disabled={!input.trim()}
          className="h-9 px-3 shrink-0"
        >
          <Send className="w-3.5 h-3.5" />
        </Button>
      </div>
    </div>
  );
}