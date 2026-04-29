"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { getRandomValues, predict, PredictionRequest } from "@/lib/api";
import { Activity, Droplets, Zap, Stethoscope, FlaskConical, Shuffle, Trash2 } from "lucide-react";
import LoadingOverlay from "@/components/LoadingOverlay";

const defaultValues: PredictionRequest = {
  yas: 50, kan_basinci: 80, ozgul_agirlik: 1.015, albumin: 2, seker: 1,
  rastgele_kan_sekeri: 100, kan_ure: 35, serum_kreatinin: 1.2, sodyum: 140,
  potasyum: 4.5, hemoglobin: 13, paketli_hucre_hacmi: 40, beyaz_kan_hucresi_sayisi: 7500,
  kirmizi_kan_hucresi_sayisi: 4.5, kirmizi_kan_hucresi: 0, irin_hucresi: 0,
  irin_hucresi_kumesi: 0, bakteri: 0, hipertansiyon: 0, diyabet: 0,
  koroner_arter_hastaligi: 0, istah: 0, ayak_odemi: 0, anemi: 0,
};

const binaryOpts = ["Yok / Normal", "Var / Anormal"];
const istahOpts = ["İyi", "Kötü"];

/* ── Dışarıda tanımlanan yardımcı bileşenler (re-mount sorununu önler) ── */

function Section({ title, icon, children }: { title: string; icon: React.ReactNode; children: React.ReactNode }) {
  return (
    <div className="apple-card" style={{ padding: 0 }}>
      <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "16px 20px 12px" }}>
        <span style={{ color: "var(--accent)", display: "flex" }}>{icon}</span>
        <span style={{ fontWeight: 600, fontSize: 15, color: "var(--text-primary)" }}>{title}</span>
      </div>
      <div style={{ height: 1, background: "var(--border-secondary)" }} />
      <div style={{ padding: "16px 20px 20px" }}>
        {children}
      </div>
    </div>
  );
}

function NumField({ label, value, onChange }: { label: string; value: number; onChange: (raw: string) => void }) {
  return (
    <div>
      <label className="apple-label">{label}</label>
      <input
        type="text"
        inputMode="decimal"
        className="apple-input"
        value={value || ""}
        placeholder="0"
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function SelectField({ label, value, opts, onChange }: { label: string; value: number; opts: string[]; onChange: (val: string) => void }) {
  return (
    <div>
      <label className="apple-label">{label}</label>
      <select
        className="apple-select"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        {opts.map((o, i) => <option key={i} value={i}>{o}</option>)}
      </select>
    </div>
  );
}

/* ── Ana Bileşen ── */

export default function InputForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [randomLoading, setRandomLoading] = useState(false);
  const [formData, setFormData] = useState<PredictionRequest>(defaultValues);

  const setNum = (field: keyof PredictionRequest, raw: string) => {
    const cleaned = raw.replace(/[^0-9.,]/g, "").replace(",", ".");
    const val = parseFloat(cleaned);
    setFormData((p) => ({ ...p, [field]: isNaN(val) ? 0 : val }));
  };

  const setInt = (field: keyof PredictionRequest, value: string) =>
    setFormData((p) => ({ ...p, [field]: parseInt(value) || 0 }));

  const handleRandom = async () => {
    setRandomLoading(true);
    try {
      const res = await getRandomValues(false);
      const v = res.data;
      setFormData({
        yas: Number(v.yas) || 50, kan_basinci: Number(v.kan_basinci) || 80,
        ozgul_agirlik: Number(v.ozgul_agirlik) || 1.015, albumin: Number(v.albumin) || 2,
        seker: Number(v.seker) || 1, rastgele_kan_sekeri: Number(v.rastgele_kan_sekeri) || 100,
        kan_ure: Number(v.kan_ure) || 35, serum_kreatinin: Number(v.serum_kreatinin) || 1.2,
        sodyum: Number(v.sodyum) || 140, potasyum: Number(v.potasyum) || 4.5,
        hemoglobin: Number(v.hemoglobin) || 13, paketli_hucre_hacmi: Number(v.paketli_hucre_hacmi) || 40,
        beyaz_kan_hucresi_sayisi: Number(v.beyaz_kan_hucresi_sayisi) || 7500,
        kirmizi_kan_hucresi_sayisi: Number(v.kirmizi_kan_hucresi_sayisi) || 4.5,
        kirmizi_kan_hucresi: Number(v.kirmizi_kan_hucresi) || 0,
        irin_hucresi: Number(v.irin_hucresi) || 0, irin_hucresi_kumesi: Number(v.irin_hucresi_kumesi) || 0,
        bakteri: Number(v.bakteri) || 0, hipertansiyon: Number(v.hipertansiyon) || 0,
        diyabet: Number(v.diyabet) || 0, koroner_arter_hastaligi: Number(v.koroner_arter_hastaligi) || 0,
        istah: Number(v.istah) || 0, ayak_odemi: Number(v.ayak_odemi) || 0, anemi: Number(v.anemi) || 0,
      });
    } catch (e) { console.error(e); }
    finally { setRandomLoading(false); }
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const sanitized = Object.fromEntries(
        Object.entries(formData).map(([k, v]) => [k, Number.isNaN(v as number) || v == null ? 0 : v])
      ) as unknown as PredictionRequest;
      const result = await predict(sanitized);
      sessionStorage.setItem("kidney_result", JSON.stringify(result));
      router.push("/result");
    } catch (e) {
      alert(e instanceof Error ? e.message : "Bilinmeyen bir hata oluştu");
      setLoading(false);
    }
  };

  return (
    <>
      {/* Tam ekran bekleme overlay'i */}
      <LoadingOverlay visible={loading} />

      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", flexDirection: "column", gap: 16 }}>
        <Section title="Genel Bilgiler" icon={<Activity size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <NumField label="Yaş" value={formData.yas} onChange={(v) => setNum("yas", v)} />
            <NumField label="Kan Basıncı (mmHg)" value={formData.kan_basinci} onChange={(v) => setNum("kan_basinci", v)} />
          </div>
        </Section>

        <Section title="Kan Testleri" icon={<Droplets size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <NumField label="Özgül Ağırlık" value={formData.ozgul_agirlik} onChange={(v) => setNum("ozgul_agirlik", v)} />
            <NumField label="Albumin (0–5)" value={formData.albumin} onChange={(v) => setNum("albumin", v)} />
            <NumField label="Şeker (0–5)" value={formData.seker} onChange={(v) => setNum("seker", v)} />
            <NumField label="Rastgele Kan Şekeri (mg/dL)" value={formData.rastgele_kan_sekeri} onChange={(v) => setNum("rastgele_kan_sekeri", v)} />
            <NumField label="Kan Üre (mg/dL)" value={formData.kan_ure} onChange={(v) => setNum("kan_ure", v)} />
            <NumField label="Serum Kreatinin (mg/dL)" value={formData.serum_kreatinin} onChange={(v) => setNum("serum_kreatinin", v)} />
          </div>
        </Section>

        <Section title="Elektrolitler & Kan Sayımı" icon={<Zap size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <NumField label="Sodyum (mEq/L)" value={formData.sodyum} onChange={(v) => setNum("sodyum", v)} />
            <NumField label="Potasyum (mEq/L)" value={formData.potasyum} onChange={(v) => setNum("potasyum", v)} />
            <NumField label="Hemoglobin (g/dL)" value={formData.hemoglobin} onChange={(v) => setNum("hemoglobin", v)} />
            <NumField label="Paketli Hücre Hacmi (%)" value={formData.paketli_hucre_hacmi} onChange={(v) => setNum("paketli_hucre_hacmi", v)} />
            <NumField label="Beyaz Kan Hücresi (/mm³)" value={formData.beyaz_kan_hucresi_sayisi} onChange={(v) => setNum("beyaz_kan_hucresi_sayisi", v)} />
            <NumField label="Kırmızı Kan Hücresi (M/μL)" value={formData.kirmizi_kan_hucresi_sayisi} onChange={(v) => setNum("kirmizi_kan_hucresi_sayisi", v)} />
          </div>
        </Section>

        <Section title="Klinik Bulgular" icon={<Stethoscope size={18} />}>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <SelectField label="Kırmızı Kan Hücreleri" value={formData.kirmizi_kan_hucresi as number} opts={binaryOpts} onChange={(v) => setInt("kirmizi_kan_hucresi", v)} />
            <SelectField label="İrin Hücreleri" value={formData.irin_hucresi as number} opts={binaryOpts} onChange={(v) => setInt("irin_hucresi", v)} />
            <SelectField label="İrin Hücresi Kümeleri" value={formData.irin_hucresi_kumesi as number} opts={binaryOpts} onChange={(v) => setInt("irin_hucresi_kumesi", v)} />
            <SelectField label="Bakteri" value={formData.bakteri as number} opts={binaryOpts} onChange={(v) => setInt("bakteri", v)} />
            <SelectField label="Hipertansiyon" value={formData.hipertansiyon as number} opts={binaryOpts} onChange={(v) => setInt("hipertansiyon", v)} />
            <SelectField label="Diyabet" value={formData.diyabet as number} opts={binaryOpts} onChange={(v) => setInt("diyabet", v)} />
            <SelectField label="Koroner Arter Hastalığı" value={formData.koroner_arter_hastaligi as number} opts={binaryOpts} onChange={(v) => setInt("koroner_arter_hastaligi", v)} />
            <SelectField label="İştah" value={formData.istah as number} opts={istahOpts} onChange={(v) => setInt("istah", v)} />
            <SelectField label="Ayak Ödemi" value={formData.ayak_odemi as number} opts={binaryOpts} onChange={(v) => setInt("ayak_odemi", v)} />
            <SelectField label="Anemi" value={formData.anemi as number} opts={binaryOpts} onChange={(v) => setInt("anemi", v)} />
          </div>
        </Section>

        {/* Actions */}
        <div style={{ display: "flex", flexWrap: "wrap", gap: 10, justifyContent: "center", paddingTop: 8, paddingBottom: 16 }}>
          <button
            className="apple-btn apple-btn-primary"
            disabled={loading}
            onClick={handleSubmit}
            style={{ paddingLeft: 32, paddingRight: 32 }}
          >
            <FlaskConical size={16} />
            {loading ? "Analiz Ediliyor..." : "Tahmin Yap"}
          </button>
          <button
            className="apple-btn apple-btn-secondary"
            disabled={randomLoading}
            onClick={handleRandom}
          >
            <Shuffle size={16} />
            {randomLoading ? "Yükleniyor..." : "Rastgele Doldur"}
          </button>
          <button
            className="apple-btn apple-btn-ghost"
            onClick={() => setFormData(defaultValues)}
          >
            <Trash2 size={16} />
            Temizle
          </button>
        </div>
      </div>
    </>
  );
}
