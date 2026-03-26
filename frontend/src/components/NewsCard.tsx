import { Article } from "@/types";

interface NewsCardProps {
  article: Article;
  onAnalyze: (content: string) => void;
}

export default function NewsCard({ article, onAnalyze }: NewsCardProps) {
  return (
    <div className="bg-white rounded-xl shadow-sm border p-6 flex flex-col justify-between">
      <div>
        <h3 className="text-lg font-semibold text-gray-900 mb-3">
          {article.title}
        </h3>
        <p className="text-gray-600 text-sm leading-relaxed line-clamp-4">
          {article.content}
        </p>
      </div>
      <button
        onClick={() => onAnalyze(article.content)}
        className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition w-full"
      >
        Analyze This Article
      </button>
    </div>
  );
}
