"use client";

import React, { createContext, useContext, useState, useCallback } from "react";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

export type ToastType = "error" | "success" | "info";

export interface ToastItem {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface ToastContextValue {
  showError: (message: string, title?: string) => void;
  showSuccess: (message: string, title?: string) => void;
  showInfo: (message: string, title?: string) => void;
  dismissToast: (id: string) => void;
}

export function formatToastMessage(message: string, title?: string): { title: string; message: string } {
  const cleanMsg = (message && message.trim()) || "An unexpected error occurred. Please try again.";
  const cleanTitle = (title && title.trim()) || "Action Failed";
  return { title: cleanTitle, message: cleanMsg };
}

const ToastContext = createContext<ToastContextValue>({
  showError: () => {},
  showSuccess: () => {},
  showInfo: () => {},
  dismissToast: () => {},
});

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const addToast = useCallback(
    (type: ToastType, message: string, customTitle?: string, duration = 5000) => {
      const id = `toast-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
      const { title, message: cleanMessage } = formatToastMessage(
        message,
        customTitle || (type === "error" ? "Action Failed" : type === "success" ? "Success" : "Notice")
      );

      const item: ToastItem = { id, type, title, message: cleanMessage, duration };
      setToasts((prev) => [...prev, item]);

      if (duration > 0) {
        setTimeout(() => {
          dismissToast(id);
        }, duration);
      }
    },
    [dismissToast]
  );

  const showError = useCallback((msg: string, title?: string) => addToast("error", msg, title), [addToast]);
  const showSuccess = useCallback((msg: string, title?: string) => addToast("success", msg, title), [addToast]);
  const showInfo = useCallback((msg: string, title?: string) => addToast("info", msg, title), [addToast]);

  return (
    <ToastContext.Provider value={{ showError, showSuccess, showInfo, dismissToast }}>
      {children}

      {/* Floating Toast Notification Container */}
      <aside
        aria-live="assertive"
        className="fixed bottom-4 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none px-4 sm:px-0"
      >
        {toasts.map((toast) => {
          const isError = toast.type === "error";
          const isSuccess = toast.type === "success";

          return (
            <div
              key={toast.id}
              role={isError ? "alert" : "status"}
              className={`pointer-events-auto rounded-xl bg-white border border-stone-200/90 p-4 shadow-lg flex items-start gap-3 transition-all animate-in fade-in slide-in-from-bottom-4 duration-200 ${
                isError ? "border-l-4 border-l-red-600" : isSuccess ? "border-l-4 border-l-emerald-600" : "border-l-4 border-l-stone-600"
              }`}
            >
              <div className="shrink-0 mt-0.5">
                {isError && <AlertCircle className="w-4 h-4 text-red-600" />}
                {isSuccess && <CheckCircle2 className="w-4 h-4 text-emerald-600" />}
                {!isError && !isSuccess && <Info className="w-4 h-4 text-stone-600" />}
              </div>

              <div className="flex-1 space-y-0.5">
                <h5 className="font-serif text-xs font-semibold text-stone-900 leading-tight">
                  {toast.title}
                </h5>
                <p className="text-xs text-stone-600 leading-relaxed">
                  {toast.message}
                </p>
              </div>

              <button
                onClick={() => dismissToast(toast.id)}
                aria-label="Dismiss notification"
                className="text-stone-400 hover:text-stone-700 p-1 -mr-1 -mt-1 rounded-md transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </aside>
    </ToastContext.Provider>
  );
}

export function useToast() {
  return useContext(ToastContext);
}