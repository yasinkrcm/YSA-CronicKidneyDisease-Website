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


def normalize_value(value: float, min_val: float, max_val: float) -> float:
    return (value - min_val) / (max_val - min_val) if max_val > min_val else 0.5


def preprocess_input(data: PredictionRequest) -> torch.Tensor:
    input_dict = data.model_dump()

    feature_order = [
        "yas", "kan_basinci", "ozgul_agirlik", "albumin", "seker",
        "rastgele_kan_sekeri", "kan_ure", "serum_kreatinin", "sodyum", "potasyum",
        "hemoglobin", "paketli_hucre_hacmi", "beyaz_kan_hucresi_sayisi", "kirmizi_kan_hucresi_sayisi",
        "kirmizi_kan_hucresi", "irin_hucresi", "irin_hucresi_kumesi", "bakteri",
        "hipertansiyon", "diyabet", "koroner_arter_hastaligi", "istah", "ayak_odemi", "anemi"
    ]

    numeric_ranges = {
        "yas": (0, 100), "kan_basinci": (50, 200), "ozgul_agirlik": (1.0, 1.03),
        "albumin": (0, 5), "seker": (0, 5), "rastgele_kan_sekeri": (50, 500),
        "kan_ure": (10, 200), "serum_kreatinin": (0.5, 15), "sodyum": (100, 160),
        "potasyum": (2, 8), "hemoglobin": (5, 20), "paketli_hucre_hacmi": (20, 60),
        "beyaz_kan_hucresi_sayisi": (2000, 20000), "kirmizi_kan_hucresi_sayisi": (2, 8)
    }

    features = []
    for key in feature_order:
        value = input_dict[key]
        if key in numeric_ranges:
            min_val, max_val = numeric_ranges[key]
            value = normalize_value(value, min_val, max_val)
        features.append(value)

    return torch.tensor(features, dtype=torch.float32).unsqueeze(0)


async def get_gemini_comment(data: PredictionRequest, prediction: int, confidence: float) -> str:
    api_key = os.getenv("GEMINI_API_KEY")
    if not api_key or not api_key.strip():
        return "Gemini API anahtarı bulunamadı. Lütfen .env dosyasını kontrol edin (GEMINI_API_KEY)."
    
    api_key = api_key.strip()

    try:
        label = get_label(prediction)

        prompt = f"""Bir nefroloji uzmanı olarak, aşağıdaki böbrek hastalığı tahmin sonucunu Türkçe olarak yorumlayın:

Tahmin: {label}
Güven Oranı: %{confidence:.1f}

Hasta Verileri:
- Yaş: {data.yas}
- Kan Basıncı: {data.kan_basinci} mmHg
- Özgül Ağırlık: {data.ozgul_agirlik}
- Albumin: {data.albumin}
- Şeker: {data.seker}
- Rastgele Kan Şekeri: {data.rastgele_kan_sekeri} mg/dL
- Kan Üre: {data.kan_ure} mg/dL
- Serum Kreatinin: {data.serum_kreatinin} mg/dL
- Sodyum: {data.sodyum} mEq/L
- Potasyum: {data.potasyum} mEq/L
- Hemoglobin: {data.hemoglobin} g/dL
- Paketli Hücre Hacmi: {data.paketli_hucre_hacmi}%
- Beyaz Kan Hücresi: {data.beyaz_kan_hucresi_sayisi}/mm³
- Kırmızı Kan Hücresi: {data.kirmizi_kan_hucresi_sayisi} M/μL

Bu hasta için yapıcı, nazik ve hastayı paniğe sevk etmeyecek şekilde açıklayıcı bir değerlendirme yazın. 
Anormal veya sınırda olan değerlerin (kan değerleri, elektrolitler vb.) ne anlama geldiğini ve hastanın günlük hayatta veya tıbbi yardım sürecinde atması gereken adımları madde madde açıklayın.
Yorumunuz hem bilimsel/tıbbi bir dille hem de hastanın anlayabileceği açıklıkta, ancak **korkutucu olmayan, destekleyici bir üslupta** olmalıdır. "Kesinlikle yanlış", "Hayati risk", "Acil" gibi hastada aşırı panik yaratacak keskin ifadeler kullanmaktan kaçının.

Lütfen yanıtınızı HTML formatında oluşturun.
- Ana başlık: <h2>Yapay Zeka Değerlendirmesi</h2>
- Alt başlıklar: <h3>Etiketini kullanın.</h3>
- Paragraflar: <p>Etiketini kullanın.</p>
- Listeler: <ul> ve <li> etiketlerini kullanın.
- Önemli yerler: <strong>Etiketini kullanın.</strong>
- Yanıtınıza ```html gibi kod blokları eklemeyin.

NOT: Eğer KBH (Kronik Böbrek Hastalığı) risk bölgesi veya teşhisi tespit edilirse, hastanın durumunu takip etmesi için bir nefroloji uzmanına başvurması gerektiğini **kibarca ve tavsiye niteliğinde** vurgulayın. Ayrıca bu analizin sadece bilgilendirme amaçlı bir yapay zeka yorumu olduğunu ve kesin teşhis yerine geçmediğini belirtin."""

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
    labels = {0: "Kronik Böbrek Hastalığı (KBH) Tespit Edildi", 1: "Normal Böbrek Fonksiyonu"}
    label = labels[prediction]

    if prediction == 0:
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


def get_label(prediction: int) -> str:
    """Map 3-class model output to 2-class frontend expectation"""
    # Model outputs 3 classes but frontend expects 2 (KBH, Normal)
    # CKD (0) vs NotCKD (1 or 2) - we treat class 0 as CKD, others as Normal
    return "KBH" if prediction == 0 else "Normal"


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
            prediction = int(np.argmax(probabilities))
            confidence = float(probabilities[prediction]) * 100.0

        gemini_comment = await get_gemini_comment(data, prediction, confidence)

        return PredictionResponse(
            prediction=prediction,
            prediction_label=get_label(prediction),
            confidence=confidence,
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