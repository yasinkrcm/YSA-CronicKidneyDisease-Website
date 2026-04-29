"use client";
import ReactMarkdown from "react-markdown";

interface ResultCardProps {
  prediction: number;
  prediction_label: string;
  confidence: number;
  gemini_comment: string;
}

export default function ResultCard({ prediction, prediction_label, confidence, gemini_comment }: ResultCardProps) {
  const isCKD = prediction === 0;
  const probabilityPercent = Math.round(confidence);

  return (
    <div className="w-full max-w-4xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 mb-4">
          <span className="text-2xl font-bold text-gray-800 dark:text-white">Tahmin Sonucu</span>
          <span className={`px-4 py-2 rounded-full font-bold text-white ${isCKD ? "bg-red-500" : "bg-green-500"}`}>
            {prediction_label}
          </span>
        </div>
        <div className="w-full">
          <div className="flex justify-between mb-2">
            <span className="text-sm text-gray-600 dark:text-gray-400">Olasılık</span>
            <span className="text-sm font-bold text-gray-800 dark:text-white">{probabilityPercent}%</span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
            <div
              className={`h-3 rounded-full transition-all ${isCKD ? "bg-red-500" : "bg-green-500"}`}
              style={{ width: `${probabilityPercent}%` }}
            />
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 dark:text-white mb-2">Gemini Yorumu</h3>
          <div
            className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 text-sm leading-relaxed text-gray-700 dark:text-gray-300 [&>h2]:text-xl [&>h2]:font-bold [&>h2]:mb-4 [&>h3]:text-lg [&>h3]:font-semibold [&>h3]:mt-4 [&>h3]:mb-2 [&>p]:mb-3 [&>ul]:list-disc [&>ul]:pl-5 [&>ul]:mb-3 [&>li]:mb-1"
            dangerouslySetInnerHTML={{ __html: gemini_comment }}
          />
        </div>

        {isCKD ? (
          <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-red-600 dark:text-red-400 mb-2">Dikkat!</h4>
            <p className="text-sm text-red-800 dark:text-red-300">
              Bu sonuç, <strong>Kronik Böbrek Hastalığı (KBH)</strong> belirtileri göstermektedir.
              Kesin tanı için bir nefroloji uzmanına danışmanız önerilir.
            </p>
          </div>
        ) : (
          <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
            <h4 className="font-semibold text-green-600 dark:text-green-400 mb-2">Sonuç Negatif</h4>
            <p className="text-sm text-green-800 dark:text-green-300">
              Bu sonuçlara göre <strong>Böbrek Hastalığı</strong> belirtisi görülmemektedir.
              Ancak semptomlarınız varsa doktorunuza danışmaya devam edin.
            </p>
          </div>
        )}
      </div>

      <div className="px-6 py-3 bg-gray-50 dark:bg-gray-900 text-center">
        <p className="text-xs text-gray-500">Bu uygulama yalnızca bilgilendirme amaçlıdır. Tıbbi tavsiye yerine geçmez.</p>
      </div>
    </div>
  );
}
