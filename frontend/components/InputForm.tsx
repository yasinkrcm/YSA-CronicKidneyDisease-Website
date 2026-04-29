"use client";

import { useState } from "react";
import { getRandomValues, predict, PredictionRequest, PredictionResponse } from "@/lib/api";

interface InputFormProps {
  onResult: (result: PredictionResponse) => void;
  initialValues?: Partial<PredictionRequest>;
}

export default function InputForm({ onResult, initialValues }: InputFormProps) {
  const [loading, setLoading] = useState(false);
  const [randomLoading, setRandomLoading] = useState(false);
  const [formData, setFormData] = useState<PredictionRequest>({
    yas: initialValues?.yas ?? 50,
    kan_basinci: initialValues?.kan_basinci ?? 80,
    ozgul_agirlik: initialValues?.ozgul_agirlik ?? 1.015,
    albumin: initialValues?.albumin ?? 2,
    seker: initialValues?.seker ?? 1,
    rastgele_kan_sekeri: initialValues?.rastgele_kan_sekeri ?? 100,
    kan_ure: initialValues?.kan_ure ?? 35,
    serum_kreatinin: initialValues?.serum_kreatinin ?? 1.2,
    sodyum: initialValues?.sodyum ?? 140,
    potasyum: initialValues?.potasyum ?? 4.5,
    hemoglobin: initialValues?.hemoglobin ?? 13,
    paketli_hucre_hacmi: initialValues?.paketli_hucre_hacmi ?? 40,
    beyaz_kan_hucresi_sayisi: initialValues?.beyaz_kan_hucresi_sayisi ?? 7500,
    kirmizi_kan_hucresi_sayisi: initialValues?.kirmizi_kan_hucresi_sayisi ?? 4.5,
    kirmizi_kan_hucresi: initialValues?.kirmizi_kan_hucresi ?? 0,
    irin_hucresi: initialValues?.irin_hucresi ?? 0,
    irin_hucresi_kumesi: initialValues?.irin_hucresi_kumesi ?? 0,
    bakteri: initialValues?.bakteri ?? 0,
    hipertansiyon: initialValues?.hipertansiyon ?? 0,
    diyabet: initialValues?.diyabet ?? 0,
    koroner_arter_hastaligi: initialValues?.koroner_arter_hastaligi ?? 0,
    istah: initialValues?.istah ?? 0,
    ayak_odemi: initialValues?.ayak_odemi ?? 0,
    anemi: initialValues?.anemi ?? 0,
  });

  const handleInputChange = (field: keyof PredictionRequest, value: string) => {
    setFormData((prev) => ({
      ...prev,
      [field]: parseFloat(value) || 0,
    }));
  };

  const handleRadioChange = (field: keyof PredictionRequest, value: number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleRandomValues = async (useGemini: boolean = true) => {
    setRandomLoading(true);
    try {
      const response = await getRandomValues(useGemini);
      const values = response.data;
      setFormData({
        yas: Number(values.yas) || 50,
        kan_basinci: Number(values.kan_basinci) || 80,
        ozgul_agirlik: Number(values.ozgul_agirlik) || 1.015,
        albumin: Number(values.albumin) || 2,
        seker: Number(values.seker) || 1,
        rastgele_kan_sekeri: Number(values.rastgele_kan_sekeri) || 100,
        kan_ure: Number(values.kan_ure) || 35,
        serum_kreatinin: Number(values.serum_kreatinin) || 1.2,
        sodyum: Number(values.sodyum) || 140,
        potasyum: Number(values.potasyum) || 4.5,
        hemoglobin: Number(values.hemoglobin) || 13,
        paketli_hucre_hacmi: Number(values.paketli_hucre_hacmi) || 40,
        beyaz_kan_hucresi_sayisi: Number(values.beyaz_kan_hucresi_sayisi) || 7500,
        kirmizi_kan_hucresi_sayisi: Number(values.kirmizi_kan_hucresi_sayisi) || 4.5,
        kirmizi_kan_hucresi: Number(values.kirmizi_kan_hucresi) || 0,
        irin_hucresi: Number(values.irin_hucresi) || 0,
        irin_hucresi_kumesi: Number(values.irin_hucresi_kumesi) || 0,
        bakteri: Number(values.bakteri) || 0,
        hipertansiyon: Number(values.hipertansiyon) || 0,
        diyabet: Number(values.diyabet) || 0,
        koroner_arter_hastaligi: Number(values.koroner_arter_hastaligi) || 0,
        istah: Number(values.istah) || 0,
        ayak_odemi: Number(values.ayak_odemi) || 0,
        anemi: Number(values.anemi) || 0,
      });
    } catch (error) {
      console.error("Random values error:", error);
    } finally {
      setRandomLoading(false);
    }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      // 422 hatasını önlemek için potansiyel NaN değerlerini 0'a çeviriyoruz
      const sanitizedData = Object.fromEntries(
        Object.entries(formData).map(([key, value]) => [
          key,
          Number.isNaN(value) || value === null || value === undefined ? 0 : value,
        ])
      ) as unknown as PredictionRequest;

      const result = await predict(sanitizedData);
      onResult(result);
    } catch (error) {
      console.error("Submit error:", error);
      alert(error instanceof Error ? error.message : "Bilinmeyen bir hata oluştu");
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setFormData({
      yas: 50, kan_basinci: 80, ozgul_agirlik: 1.015, albumin: 2, seker: 1,
      rastgele_kan_sekeri: 100, kan_ure: 35, serum_kreatinin: 1.2, sodyum: 140,
      potasyum: 4.5, hemoglobin: 13, paketli_hucre_hacmi: 40, beyaz_kan_hucresi_sayisi: 7500,
      kirmizi_kan_hucresi_sayisi: 4.5, kirmizi_kan_hucresi: 0, irin_hucresi: 0,
      irin_hucresi_kumesi: 0, bakteri: 0, hipertansiyon: 0, diyabet: 0,
      koroner_arter_hastaligi: 0, istah: 0, ayak_odemi: 0, anemi: 0,
    });
  };

  const inputClass = "w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:border-gray-600 dark:text-white text-sm";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1";
  const sectionClass = "bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6";
  const sectionTitleClass = "text-lg font-bold text-gray-800 dark:text-white mb-4";
  const btnClass = "px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50";
  const btnPrimaryClass = `${btnClass} bg-blue-600 text-white hover:bg-blue-700`;
  const btnSecondaryClass = `${btnClass} bg-purple-600 text-white hover:bg-purple-700`;
  const btnOutlineClass = `${btnClass} border-2 border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700`;
  const btnWarningClass = `${btnClass} text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-900/20`;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Genel Bilgiler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Yaş</label><input type="number" className={inputClass} value={formData.yas} onChange={(e) => handleInputChange("yas", e.target.value)} /></div>
          <div><label className={labelClass}>Kan Basıncı (mmHg)</label><input type="number" className={inputClass} value={formData.kan_basinci} onChange={(e) => handleInputChange("kan_basinci", e.target.value)} /></div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Kan Testleri</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div><label className={labelClass}>Özgül Ağırlık</label><input type="number" step="0.001" className={inputClass} value={formData.ozgul_agirlik} onChange={(e) => handleInputChange("ozgul_agirlik", e.target.value)} /></div>
          <div><label className={labelClass}>Albumin (0-5)</label><input type="number" className={inputClass} value={formData.albumin} onChange={(e) => handleInputChange("albumin", e.target.value)} /></div>
          <div><label className={labelClass}>Şeker (0-5)</label><input type="number" className={inputClass} value={formData.seker} onChange={(e) => handleInputChange("seker", e.target.value)} /></div>
          <div><label className={labelClass}>Rastgele Kan Şekeri (mg/dL)</label><input type="number" className={inputClass} value={formData.rastgele_kan_sekeri} onChange={(e) => handleInputChange("rastgele_kan_sekeri", e.target.value)} /></div>
          <div><label className={labelClass}>Kan Üre (mg/dL)</label><input type="number" className={inputClass} value={formData.kan_ure} onChange={(e) => handleInputChange("kan_ure", e.target.value)} /></div>
          <div><label className={labelClass}>Serum Kreatinin (mg/dL)</label><input type="number" step="0.1" className={inputClass} value={formData.serum_kreatinin} onChange={(e) => handleInputChange("serum_kreatinin", e.target.value)} /></div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Elektrolitler</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div><label className={labelClass}>Sodyum (mEq/L)</label><input type="number" className={inputClass} value={formData.sodyum} onChange={(e) => handleInputChange("sodyum", e.target.value)} /></div>
          <div><label className={labelClass}>Potasyum (mEq/L)</label><input type="number" step="0.1" className={inputClass} value={formData.potasyum} onChange={(e) => handleInputChange("potasyum", e.target.value)} /></div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Kan Sayımı</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <div><label className={labelClass}>Hemoglobin (g/dL)</label><input type="number" step="0.1" className={inputClass} value={formData.hemoglobin} onChange={(e) => handleInputChange("hemoglobin", e.target.value)} /></div>
          <div><label className={labelClass}>Paketli Hücre Hacmi (%)</label><input type="number" className={inputClass} value={formData.paketli_hucre_hacmi} onChange={(e) => handleInputChange("paketli_hucre_hacmi", e.target.value)} /></div>
          <div><label className={labelClass}>Beyaz Kan Hücresi (/mm³)</label><input type="number" className={inputClass} value={formData.beyaz_kan_hucresi_sayisi} onChange={(e) => handleInputChange("beyaz_kan_hucresi_sayisi", e.target.value)} /></div>
          <div><label className={labelClass}>Kırmızı Kan Hücresi (M/μL)</label><input type="number" step="0.1" className={inputClass} value={formData.kirmizi_kan_hucresi_sayisi} onChange={(e) => handleInputChange("kirmizi_kan_hucresi_sayisi", e.target.value)} /></div>
        </div>
      </div>

      <div className={sectionClass}>
        <h2 className={sectionTitleClass}>Klinik Bulgular</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[
            { field: "kirmizi_kan_hucresi" as keyof PredictionRequest, label: "Kırmızı Kan Hücreleri", opts: ["Normal", "Anormal"] },
            { field: "irin_hucresi" as keyof PredictionRequest, label: "İrin Hücreleri", opts: ["Normal", "Anormal"] },
            { field: "irin_hucresi_kumesi" as keyof PredictionRequest, label: "İrin Hücresi Kümeleri", opts: ["Yok", "Var"] },
            { field: "bakteri" as keyof PredictionRequest, label: "Bakteri", opts: ["Yok", "Var"] },
            { field: "hipertansiyon" as keyof PredictionRequest, label: "Hipertansiyon", opts: ["Yok", "Var"] },
            { field: "diyabet" as keyof PredictionRequest, label: "Diyabet", opts: ["Yok", "Var"] },
            { field: "koroner_arter_hastaligi" as keyof PredictionRequest, label: "Koroner Arter Hastalığı", opts: ["Yok", "Var"] },
            { field: "istah" as keyof PredictionRequest, label: "İştah", opts: ["İyi", "Kötü"] },
            { field: "ayak_odemi" as keyof PredictionRequest, label: "Ayak Ödemi", opts: ["Yok", "Var"] },
            { field: "anemi" as keyof PredictionRequest, label: "Anemi", opts: ["Yok", "Var"] },
          ].map(({ field, label, opts }) => (
            <div key={field}>
              <label className={labelClass}>{label}</label>
              <div className="flex gap-4 mt-2">
                {opts.map((opt, i) => (
                  <label key={i} className="flex items-center gap-2 cursor-pointer">
                    <input type="radio" name={field} checked={formData[field] === i} onChange={() => handleRadioChange(field, i)} />
                    <span className="text-sm">{opt}</span>
                  </label>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className={sectionClass}>
        <div className="flex flex-col sm:flex-row gap-3 justify-center flex-wrap">
          <button type="button" onClick={handleSubmit} disabled={loading} className={btnPrimaryClass}>{loading ? "Tahmin Yapılıyor..." : "Tahmin Yap"}</button>
          <button type="button" onClick={() => handleRandomValues(true)} disabled={randomLoading} className={btnSecondaryClass}>{randomLoading ? "Üretiliyor..." : "Rastgele (Gemini)"}</button>
          <button type="button" onClick={() => handleRandomValues(false)} disabled={randomLoading} className={btnOutlineClass}>Rastgele (Local)</button>
          <button type="button" onClick={handleClear} className={btnWarningClass}>Temizle</button>
        </div>
      </div>
    </div>
  );
}
