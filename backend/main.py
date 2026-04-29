import os
import logging
from pathlib import Path
from contextlib import asynccontextmanager
from typing import Any
import traceback

import torch
import numpy as np
import httpx
from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from pydantic import BaseModel, Field
from dotenv import load_dotenv

from model import KidneyDiseaseClassifier

load_dotenv()

logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler('error.log'),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent / "model.pt"

model = None


class PredictionRequest(BaseModel):
    yas: float = Field(..., description="Yaş")
    kan_basinci: float = Field(..., description="Kan Basıncı (mmHg)")
    ozgul_agirlik: float = Field(..., description="Özgül Ağırlık")
    albumin: float = Field(..., description="Albumin (0-5)")
    seker: float = Field(..., description="Şeker (0-5)")
    rastgele_kan_sekeri: float = Field(..., description="Rastgele Kan Şekeri (mg/dL)")
    kan_ure: float = Field(..., description="Kan Üre (mg/dL)")
    serum_kreatinin: float = Field(..., description="Serum Kreatinin (mg/dL)")
    sodyum: float = Field(..., description="Sodyum (mEq/L)")
    potasyum: float = Field(..., description="Potasyum (mEq/L)")
    hemoglobin: float = Field(..., description="Hemoglobin (g/dL)")
    paketli_hucre_hacmi: float = Field(..., description="Paketli Hücre Hacmi (%)")
    beyaz_kan_hucresi_sayisi: float = Field(..., description="Beyaz Kan Hücresi (/mm³)")
    kirmizi_kan_hucresi_sayisi: float = Field(..., description="Kırmızı Kan Hücresi (M/μL)")
    kirmizi_kan_hucresi: float = Field(..., description="Kırmızı Kan Hücreleri (0=Normal, 1=Anormal)")
    irin_hucresi: float = Field(..., description="İrin Hücreleri (0=Normal, 1=Anormal)")
    irin_hucresi_kumesi: float = Field(..., description="İrin Hücresi Kümeleri (0=Yok, 1=Var)")
    bakteri: float = Field(..., description="Bakteri (0=Yok, 1=Var)")
    hipertansiyon: float = Field(..., description="Hipertansiyon (0=Yok, 1=Var)")
    diyabet: float = Field(..., description="Diyabet (0=Yok, 1=Var)")
    koroner_arter_hastaligi: float = Field(..., description="Koroner Arter Hastalığı (0=Yok, 1=Var)")
    istah: float = Field(..., description="İştah (0=İyi, 1=Kötü)")
    ayak_odemi: float = Field(..., description="Ayak Ödemi (0=Yok, 1=Var)")
    anemi: float = Field(..., description="Anemi (0=Yok, 1=Var)")


class PredictionResponse(BaseModel):
    prediction: int
    prediction_label: str
    confidence: float
    gemini_comment: str


def load_model():
    global model
    try:
        model = KidneyDiseaseClassifier(input_size=24)
        if MODEL_PATH.exists():
            state_dict = torch.load(MODEL_PATH, map_location='cpu', weights_only=True)
            model.load_state_dict(state_dict)
            model.eval()
            logger.info("Model loaded successfully")
        else:
            logger.warning(f"Model file not found at {MODEL_PATH}, using random weights")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        model = KidneyDiseaseClassifier(input_size=24)
        model.eval()


def preprocess_input(data: PredictionRequest) -> torch.Tensor:
    """Notebook ile birebir aynı preprocessing:
    1. Feature sırası notebook'taki sütun sırası ile aynı (id ve siniflandirma hariç)
    2. StandardScaler (notebook'ta fit edilen mean/std değerleri)
    """
    # Notebook'taki sütun sırası (id ve siniflandirma çıkarılmış)
    feature_order = [
        "yas", "kan_basinci", "ozgul_agirlik", "albumin", "seker",
        "kirmizi_kan_hucresi", "irin_hucresi", "irin_hucresi_kumesi", "bakteri",
        "rastgele_kan_sekeri", "kan_ure", "serum_kreatinin", "sodyum", "potasyum",
        "hemoglobin", "paketli_hucre_hacmi", "beyaz_kan_hucresi_sayisi", "kirmizi_kan_hucresi_sayisi",
        "hipertansiyon", "diyabet", "koroner_arter_hastaligi", "istah", "ayak_odemi", "anemi"
    ]

    # StandardScaler mean/std değerleri (notebook'tan birebir)
    scaler_mean = {
        "yas": 51.483376, "kan_basinci": 76.469072, "ozgul_agirlik": 1.017408,
        "albumin": 1.016949, "seker": 0.450142,
        "kirmizi_kan_hucresi": 0.882500, "irin_hucresi": 0.810000,
        "irin_hucresi_kumesi": 0.105000, "bakteri": 0.055000,
        "rastgele_kan_sekeri": 148.036517, "kan_ure": 57.425722, "serum_kreatinin": 3.072454,
        "sodyum": 137.528754, "potasyum": 4.627244, "hemoglobin": 12.526437,
        "paketli_hucre_hacmi": 27.227500, "beyaz_kan_hucresi_sayisi": 63.905000,
        "kirmizi_kan_hucresi_sayisi": 29.962500,
        "hipertansiyon": 0.367500, "diyabet": 3.300000,
        "koroner_arter_hastaligi": 1.080000, "istah": 0.205000,
        "ayak_odemi": 0.190000, "anemi": 0.150000,
    }
    scaler_std = {
        "yas": 16.953734, "kan_basinci": 13.459442, "ozgul_agirlik": 0.005363,
        "albumin": 1.270726, "seker": 1.028199,
        "kirmizi_kan_hucresi": 0.322015, "irin_hucresi": 0.392301,
        "irin_hucresi_kumesi": 0.306553, "bakteri": 0.227980,
        "rastgele_kan_sekeri": 74.689098, "kan_ure": 49.224241, "serum_kreatinin": 5.610464,
        "sodyum": 9.192761, "potasyum": 2.816256, "hemoglobin": 2.712774,
        "paketli_hucre_hacmi": 8.294320, "beyaz_kan_hucresi_sayisi": 27.608802,
        "kirmizi_kan_hucresi_sayisi": 9.503478,
        "hipertansiyon": 0.482124, "diyabet": 0.578792,
        "koroner_arter_hastaligi": 0.289137, "istah": 0.403702,
        "ayak_odemi": 0.392301, "anemi": 0.357071,
    }

    input_dict = data.model_dump()

    features = []
    for key in feature_order:
        raw = float(input_dict[key])
        # StandardScaler: (x - mean) / std
        scaled = (raw - scaler_mean[key]) / scaler_std[key]
        features.append(scaled)

    return torch.tensor(features, dtype=torch.float32).unsqueeze(0)


async def get_gemini_comment(data: PredictionRequest, prediction: int, confidence: float) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        return "Gemini API anahtarı bulunamadı. Lütfen .env dosyasını kontrol edin (GEMINI_API_KEY)."
    
    api_key = api_key.strip()

    try:
        label = get_label(prediction)

        prompt = f"""Nefroloji uzmanı olarak aşağıdaki tahmin sonucunu Türkçe, kısa ve öz şekilde yorumla:

Tahmin: {label} | KBY Risk: %{confidence:.1f}

ÖNEMLİ PARAMETRELER (Feature Importance sırasına göre):
- SG (Özgül Ağırlık): {data.ozgul_agirlik}
- HGB (Hemoglobin): {data.hemoglobin} g/dL
- SCr (Serum Kreatinin): {data.serum_kreatinin} mg/dL
- HCT (Paketli Hücre Hacmi): {data.paketli_hucre_hacmi}%
- RBC (Kırmızı Kan Hücresi Sayısı): {data.kirmizi_kan_hucresi_sayisi} M/μL

Diğer Parametreler:
Yaş: {data.yas} | KB: {data.kan_basinci} mmHg | ALB: {data.albumin} | BUN: {data.kan_ure} mg/dL
Na: {data.sodyum} | K: {data.potasyum} | HT: {data.hipertansiyon} | DM: {data.diyabet} | Anemi: {data.anemi}

Yanıtın şu 3 bölümden oluşsun, her biri kısa (2-3 cümle veya en fazla 4 madde):
1. Genel değerlendirme (tahmin sonucu ve öne çıkan değerler)
2. Dikkat edilmesi gerekenler (yalnızca en kritik bulgular, madde madde, max 4 madde)
3. Öneri (kısa, destekleyici, panik yaratmayan 1-2 cümle)

ÖNEMLİ TERMİNOLOJİ: "Kronik Böbrek Hastalığı" veya "KBH" ifadelerini KULLANMA. Bunun yerine her zaman "Kronik Böbrek Yetmezliği" kullan.

HTML formatında yaz. Şu etiketleri kullan: <h3>, <p>, <ul>, <li>, <strong>.
Kod bloğu (```html vb.) ekleme. Korkutucu ifade kullanma.

STIL KURALLARI (inline CSS ile uygula):
- h3 etiketlerine: style="font-size:15px; font-weight:600; margin:16px 0 8px 0; color:inherit;"
- p etiketlerine: style="font-size:14px; line-height:1.7; margin:0 0 10px 0; color:inherit; opacity:0.85;"
- ul etiketlerine: style="margin:8px 0 12px 0; padding-left:20px; list-style:disc;"
- li etiketlerine: style="font-size:14px; line-height:1.7; margin-bottom:4px; color:inherit; opacity:0.85;"
- strong etiketlerine: style="font-weight:600; color:inherit; opacity:1;"
"""

        GEMINI_3_FLASH_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-3-flash-preview:generateContent?key={api_key}"
        # GEMINI_2_5_FLASH_URL = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"

        async with httpx.AsyncClient(timeout=120.0) as client:
            response = await client.post(
                GEMINI_3_FLASH_URL,
                headers={"Content-Type": "application/json"},
                json={
                    "contents": [{"parts": [{"text": prompt}]}]
                }
            )

            if response.status_code == 200:
                result = response.json()
                try:
                    return result["candidates"][0]["content"]["parts"][0]["text"]
                except (KeyError, IndexError):
                    logger.error(f"Gemini unexpected response format: {result}")
                    return f"Gemini beklenmeyen yanıt formatı: {result}"
            else:
                logger.error(f"Gemini API error: {response.status_code} - {response.text}")
                return f"Gemini API hatası: {response.status_code}"

    except Exception as e:
        logger.error(f"Gemini API exception: {traceback.format_exc()}")
        return f"Gemini bağlantı hatası: {str(e)}"


def get_default_comment(prediction: int, confidence: float) -> str:
    labels = {0: "Sağlıklı Böbrek Fonksiyonu", 1: "Kronik Böbrek Yetmezliği (KBY) Tespit Edildi"}
    label = labels[prediction]

    if prediction == 1:
        return f"{label}\n\nBu sonuç, böbreklerinizde sorun olabileceğini göstermektedir. Lütfen bir nefroloji uzmanına danışarak daha ileri tetkikler yaptırın.\n\nÖnemli: Bu uygulama tıbbi tavsiye yerine geçmez."
    else:
        return f"{label}\n\nBu sonuçlara göre böbrekleriniz sağlıklı görünmektedir. Ancak semptomlarınız varsa doktorunuza danışmaya devam edin.\n\nÖnemli: Bu uygulama tıbbi tavsiye yerine geçmez."


@asynccontextmanager
async def lifespan(app: FastAPI):
    load_model()
    logger.info("Application started")
    yield
    logger.info("Application shutdown")


app = FastAPI(
    title="Böbrek Hastalığı Sınıflandırma API",
    description="PyTorch tabanlı böbrek hastalığı sınıflandırma API'si",
    version="1.0.0",
    lifespan=lifespan
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
async def health_check():
    return {"status": "healthy", "model_loaded": model is not None}


def get_label(disease_pct: float) -> str:
    """Map disease probability to risk label"""
    if disease_pct >= 75:
        return "Hasta"
    elif disease_pct >= 50:
        return "Yüksek Risk"
    elif disease_pct >= 25:
        return "Düşük Risk"
    else:
        return "Sağlıklı"


@app.post("/predict", response_model=PredictionResponse)
async def predict(data: PredictionRequest, request: Request):
    try:
        body = await request.body()
        logger.info(f"Raw request body: {body[:500]}")
        logger.info(f"Received prediction request with {len(data.model_dump())} fields")
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")

        input_tensor = preprocess_input(data)
        logger.info(f"Input tensor shape: {input_tensor.shape}")

        with torch.no_grad():
            output = model(input_tensor)
            probabilities = torch.nn.functional.softmax(output[0], dim=0).numpy()
            # Model: class 0 = hasta (KBY), class 1+ = sağlıklı
            # Response: prediction 1 = hasta, prediction 0 = sağlıklı
            disease_pct = min(100.0, max(0.0, float(probabilities[0]) * 100.0))
            prediction = 1 if disease_pct >= 50 else 0

        label = get_label(disease_pct)
        gemini_comment = await get_gemini_comment(data, prediction, disease_pct)

        return PredictionResponse(
            prediction=prediction,
            prediction_label=label,
            confidence=disease_pct,
            gemini_comment=gemini_comment
        )

    except Exception as e:
        logger.error(f"Prediction error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.get("/random-values")
async def get_random_values(use_gemini: bool = True):
    try:
        if model is None:
            raise HTTPException(status_code=503, detail="Model not loaded")

        csv_path = Path(__file__).parent.parent / "kidney_disease_turkce.csv"
        if not csv_path.exists():
            csv_path = Path(__file__).parent / "kidney_disease_turkce.csv"
            
        if csv_path.exists():
            df = np.genfromtxt(csv_path, delimiter=',', skip_header=1, filling_values=0)
            if len(df) > 0:
                random_row = df[np.random.randint(0, len(df))]

                feature_indices = [1, 2, 3, 4, 5, 10, 11, 12, 13, 14, 15, 16, 17, 18,
                                  19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30, 31]

                values = {}
                field_mapping = {
                    1: ("yas", 0, 100), 2: ("kan_basinci", 50, 200), 3: ("ozgul_agirlik", 1.0, 1.03),
                    4: ("albumin", 0, 5), 5: ("seker", 0, 5),
                    6: ("kirmizi_kan_hucresi", 0, 1), 7: ("irin_hucresi", 0, 1),
                    8: ("irin_hucresi_kumesi", 0, 1), 9: ("bakteri", 0, 1),
                    10: ("rastgele_kan_sekeri", 50, 500), 11: ("kan_ure", 10, 200),
                    12: ("serum_kreatinin", 0.5, 15), 13: ("sodyum", 100, 160),
                    14: ("potasyum", 2, 8), 15: ("hemoglobin", 5, 20),
                    16: ("paketli_hucre_hacmi", 20, 60), 17: ("beyaz_kan_hucresi_sayisi", 2000, 20000),
                    18: ("kirmizi_kan_hucresi_sayisi", 2, 8), 19: ("hipertansiyon", 0, 1),
                    20: ("diyabet", 0, 1), 21: ("koroner_arter_hastaligi", 0, 1),
                    22: ("istah", 0, 1), 23: ("ayak_odemi", 0, 1), 24: ("anemi", 0, 1)
                }

                for idx, (field, min_val, max_val) in field_mapping.items():
                    if idx < len(random_row):
                        raw_val = random_row[idx]
                        if field in ["kirmizi_kan_hucresi", "irin_hucresi", "irin_hucresi_kumesi",
                                     "bakteri", "hipertansiyon", "diyabet", "koroner_arter_hastaligi",
                                     "istah", "ayak_odemi", "anemi"]:
                            values[field] = int(np.random.choice([0, 1]))
                        else:
                            # Make sure it's valid, else random
                            if np.isnan(raw_val) or raw_val == 0:
                                values[field] = float(round(np.random.uniform(min_val, max_val), 2))
                            else:
                                values[field] = float(round(raw_val, 2))

                return JSONResponse({"data": values})

        # Fallback fully random
        import random
        
        fallback_data = {
            "yas": random.randint(18, 90), "kan_basinci": random.randint(60, 180), "ozgul_agirlik": round(random.uniform(1.005, 1.025), 3), "albumin": random.randint(0, 5),
            "seker": random.randint(0, 5), "rastgele_kan_sekeri": random.randint(70, 300), "kan_ure": random.randint(10, 150), "serum_kreatinin": round(random.uniform(0.5, 10.0), 1),
            "sodyum": random.randint(120, 150), "potasyum": round(random.uniform(2.5, 7.0), 1), "hemoglobin": round(random.uniform(7.0, 17.0), 1), "paketli_hucre_hacmi": random.randint(20, 60),
            "beyaz_kan_hucresi_sayisi": random.randint(3000, 15000), "kirmizi_kan_hucresi_sayisi": round(random.uniform(2.0, 7.0), 1),
            "kirmizi_kan_hucresi": random.choice([0, 1]), "irin_hucresi": random.choice([0, 1]), "irin_hucresi_kumesi": random.choice([0, 1]),
            "bakteri": random.choice([0, 1]), "hipertansiyon": random.choice([0, 1]), "diyabet": random.choice([0, 1]), "koroner_arter_hastaligi": random.choice([0, 1]),
            "istah": random.choice([0, 1]), "ayak_odemi": random.choice([0, 1]), "anemi": random.choice([0, 1])
        }
        return JSONResponse({"data": fallback_data})

    except Exception as e:
        logger.error(f"Random values error: {e}")
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    port = int(os.getenv("PORT", "8001"))
    uvicorn.run(app, host="0.0.0.0", port=port)