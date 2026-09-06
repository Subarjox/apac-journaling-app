import type { Metadata } from "next";
import "./globals.css";
import { ClientProviders } from "@/components/providers/ClientProviders";

export const metadata: Metadata = {
  title: "Reflect - Thoughtful Journaling with Gemini",
  description: "A private, user-authenticated reflective journaling sanctuary powered by Gemini Flash and Cloud Firestore.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="h-full">
      <body className="min-h-full flex flex-col bg-[#fbfbf9] text-[#1c1917]">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}