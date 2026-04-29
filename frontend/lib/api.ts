const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface PredictionRequest {
  yas: number;
  kan_basinci: number;
  ozgul_agirlik: number;
  albumin: number;
  seker: number;
  rastgele_kan_sekeri: number;
  kan_ure: number;
  serum_kreatinin: number;
  sodyum: number;
  potasyum: number;
  hemoglobin: number;
  paketli_hucre_hacmi: number;
  beyaz_kan_hucresi_sayisi: number;
  kirmizi_kan_hucresi_sayisi: number;
  kirmizi_kan_hucresi: number;
  irin_hucresi: number;
  irin_hucresi_kumesi: number;
  bakteri: number;
  hipertansiyon: number;
  diyabet: number;
  koroner_arter_hastaligi: number;
  istah: number;
  ayak_odemi: number;
  anemi: number;
}

export interface PredictionResponse {
  prediction: number;
  prediction_label: string;
  confidence: number;
  gemini_comment: string;
}

export interface RandomValuesResponse {
  data: Record<string, number | string>;
}

export async function predict(data: PredictionRequest): Promise<PredictionResponse> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    let errorMessage = response.statusText;
    try {
      const errorData = await response.json();
      errorMessage = JSON.stringify(errorData);
    } catch (e) {
      // Ignored
    }
    throw new Error(`Prediction failed (${response.status}): ${errorMessage}`);
  }

  return response.json();
}

export async function getRandomValues(useGemini: boolean = true): Promise<RandomValuesResponse> {
  const response = await fetch(`${API_BASE_URL}/random-values?use_gemini=${useGemini}`, {
    method: "GET",
  });

  if (!response.ok) {
    throw new Error(`Failed to get random values: ${response.statusText}`);
  }

  return response.json();
}
