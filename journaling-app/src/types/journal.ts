export interface ChatTurn {
  id: string;
  role: "user" | "model";
  content: string;
  timestamp: number;
}

export interface JournalEntry {
  id: string;
  userId: string;
  title: string;
  content: string;
  summary: string | null;
  moodTags: string[];
  createdAt: number;
  updatedAt: number;
  turns: ChatTurn[];
}

export interface EntrySummaryResponse {
  summary: string;
  keyInsights: string[];
  suggestedTags: string[];
}
