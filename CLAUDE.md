# Böbrek Hastalığı Sınıflandırma Uygulaması

## Proje Hakkında

Bu proje, Next.js + HeroUI 3 frontend ve FastAPI + PyTorch backend kullanarak böbrek hastalığı sınıflandırması yapan bir web uygulamasıdır.

## Klasör Yapısı

```
Yapay Sinir Ağları/
├── frontend/                 # Next.js + HeroUI 3
├── backend/                  # FastAPI + Python
├── model.pt                  # PyTorch ML modeli
├── kidney_disease_turkce.csv  # Eğitim veri seti
└── CLAUDE.md                 # Bu dosya
```

## Backend (FastAPI)

### Çalıştırma
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload
# http://localhost:8000/docs
```

### API Endpoints
- `POST /predict` - Model tahmini + MiniMax yorumu
- `GET /random-values` - Rastgele hasta verileri üret
- `GET /health` - Sağlık kontrolü

### Environment Değişkenleri
- `MINIMAX_API_KEY` - MiniMax API anahtarı (`.env` dosyasında)

### Hata Logları
- Backend hataları: `backend/error.log`

## Frontend (Next.js + HeroUI)

### Çalıştırma
```bash
cd frontend
npm install
npm run dev
# http://localhost:3000
```

### Önemli Notlar
- HeroUI 3 bileşenleri kullanılmaktadır
- Backend API http://localhost:8000 adresinde çalışmalıdır
- MiniMax API anahtarı backend/.env dosyasında ayarlanmalıdır

## Hata Loglama

Tüm hatalar aşağıdaki konuma kaydedilir:
- Backend: `backend/error.log`

Hata logları otomatik olarak tarih, saat ve detayları ile kaydedilir.

## Teknolojiler

### Backend
- FastAPI - Web framework
- PyTorch - ML model
- httpx - HTTP client (MiniMax API)
- Pydantic - Veri doğrulama

### Frontend
- Next.js 15 - React framework
- HeroUI 3 - UI component library
- TypeScript - Tip güvenliği
- Tailwind CSS - Styling
