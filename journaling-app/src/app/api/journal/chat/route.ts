import { NextRequest, NextResponse } from "next/server";
import { parseBearerToken, verifyFirebaseIdToken } from "@/lib/firebase/admin";
import { streamReflectionChat } from "@/lib/gemini/service";
import type { ChatTurn } from "@/types/journal";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    const token = parseBearerToken(authHeader);

    if (!token) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or malformed Bearer token" },
        { status: 401 }
      );
    }

    let decodedUser;
    try {
      decodedUser = await verifyFirebaseIdToken(token);
    } catch (authErr) {
      console.error("Token verification failed:", authErr);
      return NextResponse.json(
        { error: "Unauthorized: Invalid authentication token" },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { prompt, history } = body as { prompt: string; history?: ChatTurn[] };

    if (!prompt || typeof prompt !== "string" || prompt.trim() === "") {
      return NextResponse.json(
        { error: "Bad Request: prompt is required and cannot be empty" },
        { status: 400 }
      );
    }

    const chatHistory: ChatTurn[] = Array.isArray(history) ? history : [];
    const textStream = streamReflectionChat(chatHistory, prompt.trim());

    const encoder = new TextEncoder();
    const readable = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of textStream) {
            controller.enqueue(encoder.encode(chunk));
          }
          controller.close();
        } catch (err) {
          console.error("Stream generation error:", err);
          controller.error(err);
        }
      }
    });

    return new Response(readable, {
      headers: {
        "Content-Type": "text/plain; charset=utf-8",
        "Cache-Control": "no-cache, no-transform",
        "X-User-Id": decodedUser.uid
      }
    });
  } catch (err: unknown) {
    console.error("Chat route unhandled error:", err);
    return NextResponse.json(
      { error: "Internal server error processing reflection" },
      { status: 500 }
    );
  }
}