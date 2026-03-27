"use client";

import { useState, useEffect } from "react";

interface PredictFormProps {
  onPredict: (text: string) => void;
  loading: boolean;
  initialText?: string;
  onTextUsed?: () => void;
}

export default function PredictForm({ onPredict, loading, initialText, onTextUsed }: PredictFormProps) {
  const [text, setText] = useState("");

  useEffect(() => {
    if (initialText) {
      // Avoid setState on every render: only update if different
      setText((prev) => {
        if (prev !== initialText) {
          onTextUsed?.();
          return initialText;
        }
        return prev;
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialText]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim()) {
      onPredict(text.trim());
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder="Paste text here to check if it's AI-generated or human-written..."
        rows={8}
        className="w-full p-4 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none bg-white"
      />
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="flex-1 bg-blue-600 text-white py-3 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Analyzing...
            </span>
          ) : (
            "Check Text"
          )}
        </button>
        <button
          type="button"
          onClick={() => { setText(""); }}
          className="px-6 py-3 border border-gray-300 rounded-xl text-gray-600 hover:bg-gray-50 transition"
        >
          Clear
        </button>
      </div>
    </form>
  );
}
