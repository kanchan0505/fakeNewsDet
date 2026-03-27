export interface User {
  id: number;
  name: string;
  email: string;
  avatar_url: string | null;
}

export interface Article {
  id: number;
  title: string;
  content: string;
}

export interface PredictionResult {
  label: "ai-generated" | "human-written" | "uncertain";
  confidence: number;
}

export interface HistoryItem {
  id: number;
  input_text: string;
  label: string;
  confidence: number;
  created_at: string;
}
