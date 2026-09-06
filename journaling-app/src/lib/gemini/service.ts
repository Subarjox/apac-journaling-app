import { GoogleGenAI } from "@google/genai";
import type { ChatTurn, EntrySummaryResponse } from "@/types/journal";
import fs from "fs";
import path from "path";

export const DEFAULT_SYSTEM_INSTRUCTION = `You are an empathetic, thoughtful, and introspective journaling companion. Your role is to help users reflect deeply on their thoughts, experiences, emotional states, and personal goals through multi-turn dialogue.

Core Behavioral Principles:
1. Reflective Listening & Gentle Inquiry: Acknowledge and validate the user's emotional experience without being patronizing. Ask thoughtful, open-ended questions (one or two at most per turn). Avoid generic advice or cliche affirmations.
2. Structure & Insight: Help identify recurring emotional themes, subconscious patterns, or latent tensions.
3. Tone & Style: Warm, grounding, articulate, and calm. Avoid robotic phrasing.
4. Safety & Boundaries: You are a journaling assistant, NOT a licensed therapist. Never diagnose conditions. If self-harm is mentioned, provide crisis hotline resources calmly and clearly.`;

function loadSystemInstruction(): string {
  try {
    const filePath = path.resolve(process.cwd(), "..", "system_Instruction.md");
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, "utf-8").trim();
      if (content.length > 50) return content;
    }
  } catch (err) {
    // Fallback to default in serverless or build environments
  }
  return DEFAULT_SYSTEM_INSTRUCTION;
}

export async function* streamReflectionChat(
  history: ChatTurn[],
  userPrompt: string
): AsyncGenerator<string, void, unknown> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key" || apiKey.startsWith("mock-")) {
    const simulatedReplies = [
      "I hear how much weight that carries. ",
      "When you think about this situation, ",
      "what underlying need or boundary feels most compromised right now? ",
      "Take your time to explore that feeling."
    ];
    for (const piece of simulatedReplies) {
      yield piece;
      await new Promise((r) => setTimeout(r, 40));
    }
    return;
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = loadSystemInstruction();

  const formattedContents = [
    ...history.map((turn) => ({
      role: turn.role === "user" ? "user" : "model",
      parts: [{ text: turn.content }]
    })),
    {
      role: "user",
      parts: [{ text: userPrompt }]
    }
  ];

  const responseStream = await ai.models.generateContentStream({
    model: "gemini-2.5-flash",
    contents: formattedContents,
    config: {
      systemInstruction: {
        parts: [{ text: systemInstruction }]
      },
      temperature: 0.7
    }
  });

  for await (const chunk of responseStream) {
    if (chunk.text) {
      yield chunk.text;
    }
  }
}

export async function generateEntrySummary(
  entryContent: string,
  turns: ChatTurn[]
): Promise<EntrySummaryResponse> {
  const apiKey = process.env.GEMINI_API_KEY;

  if (!apiKey || apiKey === "your_gemini_api_key" || apiKey.startsWith("mock-")) {
    return {
      summary: "A candid personal reflection touching on emotional overwhelm, daily friction, and the search for balance.",
      keyInsights: [
        "Identified persistent friction between current obligations and personal boundaries.",
        "Recognized the need for deliberate pacing and intentional pauses."
      ],
      suggestedTags: ["reflection", "boundaries", "clarity"]
    };
  }

  const ai = new GoogleGenAI({ apiKey });
  const transcript = turns
    .map((t) => `${t.role.toUpperCase()}: ${t.content}`)
    .join("\n");

  const prompt = `Analyze the following personal journal entry and reflection dialogue:

INITIAL ENTRY:
${entryContent}

DIALOGUE:
${transcript}

Synthesize this session into JSON matching this exact structure:
{
  "summary": "2-3 sentence overview of main thoughts and emotional states",
  "keyInsights": ["bullet 1", "bullet 2"],
  "suggestedTags": ["tag1", "tag2", "tag3"]
}`;

  const response = await ai.models.generateContent({
    model: "gemini-2.5-flash",
    contents: prompt,
    config: {
      responseMimeType: "application/json"
    }
  });

  try {
    const parsed = JSON.parse(response.text || "{}");
    return {
      summary: parsed.summary || "Reflection entry synthesized.",
      keyInsights: parsed.keyInsights || [],
      suggestedTags: parsed.suggestedTags || ["journal"]
    };
  } catch (err) {
    return {
      summary: response.text || "Entry recorded.",
      keyInsights: [],
      suggestedTags: ["journal"]
    };
  }
}