# 🔬 Kronik Böbrek Hastalığı Sınıflandırma Uygulaması

Yapay Sinir Ağları (YSA) ile **kronik böbrek hastalığı (KBY) riskini tahmin eden** modern bir web uygulaması. Kullanıcı, 24 adet tıbbi parametre (kan tahlilleri, yaşam tarzı bilgileri vb.) girerek PyTorch tabanlı bir MLP modelinin tahminini ve Gemini tarafından üretilen Türkçe bir uzman yorumunu alır.

> ⚠️ **Uyarı:** Bu uygulama bir eğitim/araştırma projesidir ve **tıbbi tavsiye yerine geçmez**. Sonuçlar yalnızca bilgilendirme amaçlıdır; mutlaka bir nefroloji uzmanına danışın.

---

## 📌 Özellikler

- 🧠 **MLP (Çok Katmanlı Perseptron) modeli** — PyTorch ile eğitilmiş, 24 girişte 2 sınıf (hasta / sağlıklı) çıktı
- 📊 **Duyarlılık etiketleri** — Tahmin olasılığına göre `Sağlıklı` → `Düşük Risk` → `Yüksek Risk` → `Hasta` sınıflandırması
- 💬 **Gemini ile Türkçe uzman yorumu** — Tahmin sonucu, nefroloji uzmanı yaklaşımıyla 3 bölümde (genel değerlendirme, dikkat edilecekler, öneri) açıklanır
- 🎲 **Rastgele hasta verisi** — Gerçek veri setinden örnek hasta verisi ile hızlı deneme imkânı
- 🧪 **Interaktif hasta veri formu** — Next.js + HeroUI 3 ile tasarlanmış, kullanıcı dostu arayüz
- 📈 **Eğitim notebook'u** — Veri temizleme, model eğitimi ve değerlendirme adımları `kidney_disease_ANN.ipynb` içinde

---

## 🏗️ Mimari

```
┌──────────────────────┐         ┌───────────────────────────┐
│  Frontend (Next.js)  │  POST   │    Backend (FastAPI)      │
│  localhost:3000      │ ──────► │  localhost:8001           │
│                      │         │                           │
│  Hasta veri formu    │         │  1. StandardScaler        │
│  HeroUI 3 + Tailwind │         │  2. PyTorch MLP (24→64→32→2)
│  Sonuç + yorum       │ ◄────── │  3. Risk etiketi          │
└──────────────────────┘         │  4. Gemini Türkçe yorum   │
                                 └───────────────────────────┘
```

---

## 📁 Proje Yapısı

```
├── frontend/                     # Next.js 15 + HeroUI 3 arayüz
├── backend/
│   ├── main.py                   # FastAPI uygulaması (tahmin + yorum)
│   ├── model.py                  # PyTorch model sınıfı
│   ├── model.pt                  # Eğitilmiş model ağırlıkları
│   └── requirements.txt          # Python bağımlılıkları
├── kidney_disease_turkce.csv     # Eğitim veri seti (Türkçe başlıklar)
├── kidney_disease_ANN.ipynb      # Model eğitimi notebook'u
├── retrain_model.py              # Veri temizleme + yeniden eğitim scripti
├── check_sensitivity.py          # Model duyarlılık analizi
├── ecosystem.config.js           # PM2 deployment konfigürasyonu
└── ANN_Hipotiroid.pptx           # Sunum materyalleri
```

---

## ☁️ Backend Kurulumu (FastAPI + PyTorch)

```bash
cd backend
pip install -r requirements.txt

# .env dosyası oluşturun:
echo "GEMINI_API_KEY=your_key_here" > .env

uvicorn main:app --reload
```

- 🌐 API: http://localhost:8001
- 📚 Swagger dokümantasyonu: http://localhost:8001/docs

> Python versiyonu ≥ 3.10 önerilir (PyTorch Pydantic uyumluluğu için).

## 🎨 Frontend Kurulumu (Next.js 15)

```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

> Frontend'in çalışabilmesi için backend'in 8001 portunda çalışıyor olması gerekir.

---

## 🌐 API Endpoints

| Method | Endpoint          | Açıklama                                                |
|--------|-------------------|---------------------------------------------------------|
| `POST` | `/predict`        | 24 parametre ile tahmin + Gemini yorumu                 |
| `GET`  | `/random-values`  | Veri setinden rastgele hasta verisi üretir              |
| `GET`  | `/health`         | Sağlık kontrolü ve model yükleme durumu                 |

### Örnek `/predict` isteği

```json
{
  "yas": 48,
  "kan_basinci": 80,
  "ozgul_agirlik": 1.02,
  "albumin": 1,
  "seker": 0,
  "rastgele_kan_sekeri": 130,
  "kan_ure": 40,
  "serum_kreatinin": 1.6,
  "sodyum": 137,
  "potasyum": 4.5,
  "hemoglobin": 12,
  "paketli_hucre_hacmi": 40,
  "beyaz_kan_hucresi_sayisi": 8000,
  "kirmizi_kan_hucresi_sayisi": 4.5,
  "kirmizi_kan_hucresi": 1,
  "irin_hucresi": 1,
  "irin_hucresi_kumesi": 0,
  "bakteri": 0,
  "hipertansiyon": 0,
  "diyabet": 0,
  "koroner_arter_hastaligi": 0,
  "istah": 0,
  "ayak_odemi": 0,
  "anemi": 0
}
```

---

## 🧠 Model Detayları

| Özellik             | Değer                                            |
|---------------------|--------------------------------------------------|
| Mimari              | MLP: `24 → 64 → 32 → 2`                          |
| Aktivasyon          | ReLU                                             |
| Kayıp Fonksiyonu    | CrossEntropyLoss (sınıf dengeli ağırlıklarla)     |
| Optimizasyon        | Adam (lr=0.001)                                  |
| Ağırlık Başlatma    | Xavier uniform                                    |
| Doğrulama stratejisi | Train/Val/Test (%70/%15/%15, stratified)         |
| Kaydetme            | En iyi validation accuracy modeli (`model.pt`)    |

### Veri Ön İşleme
- `?` ve boşluk temizliği, kategorik değişkenlerin binary encode edilmesi
- Sayısal eksik değerler **medyan** ile doldurulur
- Girişler **StandardScaler** ile normalize edilir (mean/std `backend/main.py` içinde gömülü)

---

## 🚀 Deployment (PM2)

```bash
pm2 start ecosystem.config.js     # ysa-backend + ysa-frontend
pm2 logs                          # logları izle
```

---

## 🛠️ Teknolojiler

| Katman   | Teknoloji                                                    |
|----------|--------------------------------------------------------------|
| Frontend | Next.js 15, HeroUI 3, Tailwind CSS 4, Framer Motion, TypeScript |
| Backend  | FastAPI, PyTorch 2.2, Pydantic 2, httpx, NumPy                |
| ML       | PyTorch MLP, scikit-learn (StandardScaler, train/test split)  |
| AI Yorum | Google Gemini Flash API                                       |

---

## 📄 Lisans & Katkı

Bu proje eğitim amaçlı yapılmıştır. Geri bildirimler için issue veya PR açmaktan çekinmeyin.

> 🔬 **Tıbbi Sorumluluk:** Model çıktıları istatistiksel tahmindir ve klinik tanı koymak için kullanılamaz.
