"use client";

import React, { useState, useRef, useEffect } from "react";
import { useAuth } from "@/context/AuthContext";
import type { ChatTurn } from "@/types/journal";
import { Button } from "@/components/ui/Button";
import { Send, Bot, User, Sparkles } from "lucide-react";

interface ReflectionStreamProps {
  turns: ChatTurn[];
  onAddTurn: (turn: ChatTurn) => void;
  entryContent: string;
}

export function ReflectionStream({
  turns,
  onAddTurn,
  entryContent
}: ReflectionStreamProps) {
  const { getIdToken } = useAuth();
  const [input, setInput] = useState("");
  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [turns, streamingContent]);

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
          history: [...turns, userTurn]
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
      onAddTurn(modelTurn);
    } catch (err) {
      console.error("Reflection chat failed:", err);
      const errorTurn: ChatTurn = {
        id: `turn-${Date.now()}-model`,
        role: "model",
        content: "I ran into a problem connecting to reflection services. Please check your network or try again.",
        timestamp: Date.now()
      };
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
      <div className="p-4 border-b border-stone-200/80 bg-white flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-stone-700" />
          <span className="font-serif text-sm font-semibold text-stone-900">
            Gemini Reflection Partner
          </span>
        </div>
        <span className="text-[11px] text-stone-400">Press Cmd+Enter to send</span>
      </div>

      {/* Message Stream */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {turns.length === 0 && !isStreaming ? (
          <div className="p-8 text-center flex flex-col items-center justify-center h-full text-stone-400">
            <Bot className="w-8 h-8 mb-2 opacity-50 text-stone-500" />
            <p className="text-xs max-w-xs leading-relaxed">
              Write an initial entry, or ask Gemini to reflect on what you have written so far.
            </p>
          </div>
        ) : (
          <>
            {turns.map((turn) => {
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