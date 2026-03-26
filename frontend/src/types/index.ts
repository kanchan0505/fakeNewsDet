export interface Article {
  id: number;
  title: string;
  content: string;
}

export interface PredictionResult {
  label: "fake" | "real";
  confidence: number;
}

export interface HistoryItem {
  id: number;
  input_text: string;
  label: string;
  confidence: number;
  created_at: string;
}
