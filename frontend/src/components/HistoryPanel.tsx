import { HistoryItem } from "@/types";

interface HistoryPanelProps {
  history: HistoryItem[];
}

export default function HistoryPanel({ history }: HistoryPanelProps) {
  if (history.length === 0) {
    return (
      <p className="text-center text-gray-500 mt-8">
        No prediction history yet. Make some predictions or click &quot;Load History&quot; to fetch from the database.
      </p>
    );
  }

  return (
    <div className="space-y-4">
      {history.map((item) => (
        <div
          key={item.id}
          className={`bg-white rounded-xl shadow-sm border p-4 flex items-center justify-between ${
            item.label === "fake" ? "border-l-4 border-l-red-400" : "border-l-4 border-l-green-400"
          }`}
        >
          <div className="flex-1 min-w-0">
            <p className="text-sm text-gray-700 truncate">{item.input_text}</p>
            <p className="text-xs text-gray-400 mt-1">
              {new Date(item.created_at).toLocaleString()}
            </p>
          </div>
          <div className="flex items-center gap-3 ml-4">
            <span
              className={`px-3 py-1 rounded-full text-xs font-semibold ${
                item.label === "fake"
                  ? "bg-red-100 text-red-700"
                  : "bg-green-100 text-green-700"
              }`}
            >
              {item.label.toUpperCase()}
            </span>
            <span className="text-sm font-medium text-gray-600">
              {(item.confidence * 100).toFixed(1)}%
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}
