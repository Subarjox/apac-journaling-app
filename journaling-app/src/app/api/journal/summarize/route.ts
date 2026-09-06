import { NextRequest, NextResponse } from "next/server";
import { parseBearerToken, verifyFirebaseIdToken } from "@/lib/firebase/admin";
import { generateEntrySummary } from "@/lib/gemini/service";
import type { ChatTurn } from "@/types/journal";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = parseBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing Bearer token" },
        { status: 401 }
      );
    }

    try {
      await verifyFirebaseIdToken(token);
    } catch (authErr) {
      return NextResponse.json(
        { error: "Unauthorized: Invalid authentication token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { content, turns } = body as { content: string; turns?: ChatTurn[] };

    const chatTurns: ChatTurn[] = Array.isArray(turns) ? turns : [];
    const summaryResponse = await generateEntrySummary(content || "", chatTurns);

    return NextResponse.json(summaryResponse, { status: 200 });
  } catch (err: unknown) {
    console.error("Summarize route error:", err);
    return NextResponse.json(
      { error: "Internal server error generating summary" },
      { status: 500 }
    );
  }
}