"use client";

import { useState } from "react";
import InputForm from "@/components/InputForm";
import ResultCard from "@/components/ResultCard";
import { PredictionResponse } from "@/lib/api";

export default function Home() {
  const [result, setResult] = useState<PredictionResponse | null>(null);

  const handleResult = (predictionResult: PredictionResponse) => {
    setResult(predictionResult);
    setTimeout(() => {
      document.getElementById("result-section")?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-black py-12 px-4">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <div className="flex justify-center gap-3 items-center">
            <h1 className="text-4xl font-bold text-gray-800 dark:text-white">
              Böbrek Hastalığı Sınıflandırması
            </h1>
            <span className="px-4 py-2 bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300 rounded-full text-sm font-medium">
              AI Powered
            </span>
          </div>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Yapay zeka destekli bu uygulama, böbrek hastalığı riskini belirlemek için
            makine öğrenmesi modeli ve Gemini AI yorumlaması kullanmaktadır.
          </p>
        </div>

        <InputForm onResult={handleResult} />

        {result && (
          <div id="result-section" className="animate-fade-in">
            <ResultCard
              prediction={result.prediction}
              prediction_label={result.prediction_label}
              confidence={result.confidence}
              gemini_comment={result.gemini_comment}
            />
          </div>
        )}

        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 max-w-4xl mx-auto">
          <p className="text-center text-sm text-gray-500">
            <strong>Not:</strong> Bu uygulama yalnızca bilgilendirme amaçlıdır ve tıbbi tavsiye
            yerine geçmez. Kesin tanı için lütfen bir sağlık uzmanına danışınız.
          </p>
        </div>
      </div>
    </div>
  );
}
