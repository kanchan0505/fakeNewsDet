"use client";

import { useState } from "react";
import Navbar from "@/components/Navbar";
import NewsCard from "@/components/NewsCard";
import PredictForm from "@/components/PredictForm";
import HistoryPanel from "@/components/HistoryPanel";
import { Article, PredictionResult, HistoryItem } from "@/types";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Home() {
  const [articles, setArticles] = useState<Article[]>([]);
  const [loadingNews, setLoadingNews] = useState(false);
  const [prediction, setPrediction] = useState<PredictionResult | null>(null);
  const [predicting, setPredicting] = useState(false);
  const [history, setHistory] = useState<HistoryItem[]>([]);
  const [activeTab, setActiveTab] = useState<"detect" | "news" | "history">("detect");
  const [analyzeText, setAnalyzeText] = useState("");

  const fetchNews = async () => {
    setLoadingNews(true);
    try {
      const res = await fetch(`${API_URL}/news`);
      const data = await res.json();
      setArticles(data);
    } catch {
      alert("Failed to fetch news. Is the backend running?");
    } finally {
      setLoadingNews(false);
    }
  };

  const handlePredict = async (text: string) => {
    setPredicting(true);
    setPrediction(null);
    try {
      const res = await fetch(`${API_URL}/predict`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text }),
      });
      const data = await res.json();
      setPrediction(data);
    } catch {
      alert("Prediction failed. Is the backend running?");
    } finally {
      setPredicting(false);
    }
  };

  const fetchHistory = async () => {
    try {
      const res = await fetch(`${API_URL}/history`);
      const data = await res.json();
      setHistory(data);
    } catch {
      setHistory([]);
    }
  };

  const handleAnalyzeArticle = (content: string) => {
    setActiveTab("detect");
    setAnalyzeText(content);
    handlePredict(content);
  };

  return (
    <div className="min-h-screen">
      <Navbar activeTab={activeTab} setActiveTab={setActiveTab} />

      <main className="max-w-6xl mx-auto px-4 py-8">
        {activeTab === "detect" && (
          <div className="space-y-6">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Fake News Detector
              </h1>
              <p className="text-gray-600 text-lg">
                Paste any news article to check if it&apos;s real or fake using AI
              </p>
            </div>
            <PredictForm
              onPredict={handlePredict}
              loading={predicting}
              initialText={analyzeText}
              onTextUsed={() => setAnalyzeText("")}
            />
            {prediction && <ResultCard prediction={prediction} />}
          </div>
        )}

        {activeTab === "news" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Demo News Articles
              </h1>
              <p className="text-gray-600 text-lg mb-4">
                Sample articles to test the detector
              </p>
              {articles.length === 0 && (
                <button
                  onClick={fetchNews}
                  disabled={loadingNews}
                  className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
                >
                  {loadingNews ? "Loading..." : "Load Demo News"}
                </button>
              )}
            </div>
            <div className="grid md:grid-cols-2 gap-6">
              {articles.map((article) => (
                <NewsCard
                  key={article.id}
                  article={article}
                  onAnalyze={handleAnalyzeArticle}
                />
              ))}
            </div>
          </div>
        )}

        {activeTab === "history" && (
          <div>
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                Prediction History
              </h1>
              <p className="text-gray-600 text-lg mb-4">
                Past predictions stored in the database
              </p>
              <button
                onClick={fetchHistory}
                className="bg-blue-600 text-white px-6 py-3 rounded-lg hover:bg-blue-700 transition"
              >
                Load History
              </button>
            </div>
            <HistoryPanel history={history} />
          </div>
        )}
      </main>
    </div>
  );
}

function ResultCard({ prediction }: { prediction: PredictionResult }) {
  const isFake = prediction.label === "fake";
  const confidence = (prediction.confidence * 100).toFixed(1);

  return (
    <div
      className={`rounded-xl p-6 border-2 ${
        isFake
          ? "bg-red-50 border-red-300"
          : "bg-green-50 border-green-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-2xl font-bold mb-1">
            {isFake ? "🚨 Likely FAKE" : "✅ Likely REAL"}
          </h3>
          <p className="text-gray-600">
            The AI model classified this news as{" "}
            <span className="font-semibold">{prediction.label.toUpperCase()}</span>
          </p>
        </div>
        <div className="text-right">
          <div className="text-3xl font-bold">
            {confidence}%
          </div>
          <p className="text-sm text-gray-500">confidence</p>
        </div>
      </div>
      <div className="mt-4">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className={`h-3 rounded-full transition-all duration-500 ${
              isFake ? "bg-red-500" : "bg-green-500"
            }`}
            style={{ width: `${confidence}%` }}
          />
        </div>
      </div>
    </div>
  );
}
