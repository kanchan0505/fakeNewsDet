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

export interface FactCheckClaim {
  claim: string;
  claimant: string;
  rating: string;
  publisher: string;
  url: string;
  review_date: string;
  verdict: string;
}

export interface NewsPredictionResult {
  label: "real" | "fake" | "uncertain";
  confidence: number;
  claims?: FactCheckClaim[];
  matches?: number;
  error?: string;
  reason?: string;
  used_broad_query?: boolean;
}

export interface HistoryItem {
  id: number;
  input_text: string;
  label: string;
  confidence: number;
  created_at: string;
}
