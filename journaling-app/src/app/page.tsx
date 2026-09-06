"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/context/ToastContext";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { BookOpen, Sparkles, ShieldCheck, ArrowRight } from "lucide-react";

function getFriendlyAuthError(code: string): string | null {
  switch (code) {
    case "auth/popup-closed-by-user":
    case "auth/user-cancelled":
      return null;
    case "auth/unauthorized-domain":
      return "This domain (localhost) is not authorized in Firebase Console. Add localhost under Authentication > Settings > Authorized domains.";
    case "auth/configuration-not-found":
      return "Google Sign-In is not enabled in your Firebase Console. Please enable Google in Authentication > Sign-in method.";
    case "auth/popup-blocked":
      return "The sign-in popup was blocked by your browser. Please allow popups for localhost.";
    case "auth/network-request-failed":
      return "Network connection issue. Please check your internet connection.";
    default:
      return "Unable to complete Google Sign-In. Please check your credentials and try again.";
  }
}

export default function LandingPage() {
  const { user, loading, signInWithGoogle } = useAuth();
  const { showError } = useToast();
  const router = useRouter();
  const [isSigningIn, setIsSigningIn] = useState(false);

  const handleSignIn = async () => {
    setIsSigningIn(true);
    try {
      await signInWithGoogle();
      router.push("/dashboard");
    } catch (err: unknown) {
      console.error("Sign-in attempt failed:", err);
      const errorCode = (err as { code?: string })?.code || "";
      const friendly = getFriendlyAuthError(errorCode);
      if (friendly) {
        showError(friendly, "Sign-In Failed");
      }
    } finally {
      setIsSigningIn(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between p-6 sm:p-12 md:p-20 max-w-5xl mx-auto">
      {/* Header / Brand */}
      <header className="flex items-center justify-between border-b border-stone-200 pb-6">
        <div className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-lg bg-stone-900 flex items-center justify-center text-white shadow-xs">
            <BookOpen className="w-5 h-5" />
          </div>
          <span className="font-serif text-xl tracking-tight font-semibold text-stone-900">Reflect</span>
        </div>

        {user ? (
          <Button onClick={() => router.push("/dashboard")} variant="outline" size="sm">
            Dashboard <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        ) : (
          <Button onClick={handleSignIn} isLoading={isSigningIn} variant="outline" size="sm">
            Sign In
          </Button>
        )}
      </header>

      {/* Hero Section */}
      <main className="my-auto py-16 sm:py-24 max-w-2xl">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-stone-100 border border-stone-200 text-xs font-medium text-stone-700 mb-6">
          <Sparkles className="w-3.5 h-3.5 text-stone-700" />
          Powered by Gemini 3.6 Flash & Cloud Firestore
        </div>

        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-serif font-normal tracking-tight text-stone-900 leading-[1.15] mb-6">
          A quiet space to clarify your mind.
        </h1>

        <p className="text-lg text-stone-600 font-normal leading-relaxed mb-8">
          Write unfiltered thoughts. Engage in gentle, Socratic reflection with Gemini without judgment, unsolicited life advice, or noise.
        </p>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3.5">
          <Button
            size="lg"
            onClick={user ? () => router.push("/dashboard") : handleSignIn}
            isLoading={isSigningIn || loading}
            className="shadow-sm"
          >
            {user ? "Open Your Journal" : "Continue with Google"}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>

          <span className="text-xs text-stone-500 flex items-center gap-1.5 self-center sm:self-auto sm:ml-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            Private & strictly user-isolated
          </span>
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-16 pt-12 border-t border-stone-200">
          <Card className="p-4 bg-stone-50/70 border-stone-200">
            <h3 className="font-serif font-medium text-stone-900 mb-1">Empathetic Mirror</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Gemini asks grounding questions to help you uncover underlying themes in your day.
            </p>
          </Card>

          <Card className="p-4 bg-stone-50/70 border-stone-200">
            <h3 className="font-serif font-medium text-stone-900 mb-1">Encrypted & Isolated</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Cloud Firestore security rules isolate your entries strictly to your unique account UID.
            </p>
          </Card>

          <Card className="p-4 bg-stone-50/70 border-stone-200">
            <h3 className="font-serif font-medium text-stone-900 mb-1">Key Insight Synthesis</h3>
            <p className="text-xs text-stone-600 leading-relaxed">
              Synthesize multi-turn conversations into concise takeaways and mood tags in one click.
            </p>
          </Card>
        </div>
      </main>

      {/* Footer */}
      <footer className="pt-6 border-t border-stone-200 text-xs text-stone-500 flex flex-col sm:flex-row items-center justify-between gap-4">
        <span>© 2026 Reflect App. All thoughts reserved.</span>
        <span>Minimalist craft guided by Anthropic & Addy Osmani UI principles.</span>
      </footer>
    </div>
  );
}