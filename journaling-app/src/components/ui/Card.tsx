import React from "react";
import { clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function Card({ className, children, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={twMerge(clsx("bg-white border border-stone-200 rounded-xl shadow-xs p-6", className))}
      {...props}
    >
      {children}
    </div>
  );
}
