"use client";

import { AlertTriangle, CheckCircle, ShieldAlert, ShieldCheck, Bot, Hospital, Heart, Phone, ExternalLink } from "lucide-react";

interface ResultCardProps {
  prediction: number;
  prediction_label: string;
  confidence: number;
  gemini_comment: string;
}

function getRiskStyle(pct: number) {
  if (pct >= 75) return {
    color: "var(--danger)", bg: "var(--danger-bg)", border: "var(--danger-border)",
    icon: <AlertTriangle size={22} style={{ color: "var(--danger)" }} />,
    title: "Kronik Böbrek Yetmezliği Tespit Edildi",
    barGradient: "linear-gradient(90deg, #ff3b30, #ff6b6b)",
    alertIcon: <Hospital size={20} style={{ color: "var(--danger)", flexShrink: 0, marginTop: 2 }} />,
    alertTitle: "Uzman Görüşü Gerekli",
    alertMsg: "Bu sonuç Kronik Böbrek Yetmezliği belirtileri göstermektedir. Kesin tanı için bir nefroloji uzmanına başvurmanız önerilir.",
  };
  if (pct >= 50) return {
    color: "#ff9500", bg: "rgba(255,149,0,0.1)", border: "rgba(255,149,0,0.2)",
    icon: <ShieldAlert size={22} style={{ color: "#ff9500" }} />,
    title: "Yüksek Hastalık Riski",
    barGradient: "linear-gradient(90deg, #ff9500, #ffb340)",
    alertIcon: <ShieldAlert size={20} style={{ color: "#ff9500", flexShrink: 0, marginTop: 2 }} />,
    alertTitle: "Uzman Görüşü Önerilir",
    alertMsg: "Hastalık riski yüksek görünmektedir. Detaylı tetkik için bir nefroloji uzmanına danışmanız önerilir.",
  };
  if (pct >= 25) return {
    color: "#ffcc00", bg: "rgba(255,204,0,0.1)", border: "rgba(255,204,0,0.2)",
    icon: <ShieldCheck size={22} style={{ color: "#ffcc00" }} />,
    title: "Düşük Hastalık Riski",
    barGradient: "linear-gradient(90deg, #ffcc00, #ffdb4d)",
    alertIcon: <ShieldCheck size={20} style={{ color: "#ffcc00", flexShrink: 0, marginTop: 2 }} />,
    alertTitle: "Takip Önerilir",
    alertMsg: "Düşük düzeyde risk tespit edilmiştir. Düzenli sağlık kontrollerinizi sürdürmeniz önerilir.",
  };
  return {
    color: "var(--success)", bg: "var(--success-bg)", border: "var(--success-border)",
    icon: <CheckCircle size={22} style={{ color: "var(--success)" }} />,
    title: "Sağlıklı Böbrek Fonksiyonu",
    barGradient: "linear-gradient(90deg, var(--success), #6dd5a0)",
    alertIcon: <Heart size={20} style={{ color: "var(--success)", flexShrink: 0, marginTop: 2 }} />,
    alertTitle: "Sonuç Normal",
    alertMsg: "Böbrek yetmezliği belirtisi saptanmadı. Yine de semptom varsa doktorunuza danışın.",
  };
}

export default function ResultCard({ prediction, prediction_label, confidence, gemini_comment }: ResultCardProps) {
  const pct = Math.round(confidence);
  const risk = getRiskStyle(pct);

  return (
    <div className="apple-card" style={{ overflow: "hidden" }}>
      {/* Header */}
      <div style={{ padding: "24px 24px 20px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
            <div style={{
              width: 44, height: 44, borderRadius: 12,
              background: risk.bg,
              display: "flex", alignItems: "center", justifyContent: "center",
            }}>
              {risk.icon}
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 500, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Tahmin Sonucu</p>
              <p style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)", lineHeight: 1.3 }}>
                {risk.title}
              </p>
            </div>
          </div>
          <span style={{
            padding: "6px 14px", borderRadius: 20, fontSize: 13, fontWeight: 600,
            background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`,
          }}>
            {prediction_label}
          </span>
        </div>

        {/* Progress */}
        <div style={{ marginTop: 20 }}>
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
            <span style={{ fontSize: 12, color: "var(--text-secondary)" }}>Kronik Böbrek Yetmezliği Risk Oranı</span>
            <span style={{ fontSize: 13, fontWeight: 700, color: "var(--text-primary)" }}>{pct}%</span>
          </div>
          <div style={{ width: "100%", height: 6, borderRadius: 3, background: "var(--bg-input)" }}>
            <div style={{
              width: `${pct}%`, height: "100%", borderRadius: 3,
              background: risk.barGradient,
              transition: "width 0.8s cubic-bezier(0.25,0.46,0.45,0.94)",
            }} />
          </div>
        </div>
      </div>

      <div style={{ height: 1, background: "var(--border-secondary)" }} />

      {/* Gemini Comment */}
      <div style={{ padding: "20px 24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
          <Bot size={18} style={{ color: "var(--accent)" }} />
          <span style={{ fontWeight: 600, fontSize: 14, color: "var(--text-primary)" }}>Yapay Zeka Değerlendirmesi</span>
          <span style={{
            fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 10,
            background: "var(--accent-light)", color: "var(--accent)",
          }}>Gemini AI</span>
        </div>

        <div
          style={{
            borderRadius: "var(--radius-sm)",
            background: "var(--bg-input)",
            border: "1px solid var(--border-secondary)",
            padding: "16px 20px",
            color: "var(--text-primary)",
          }}
          dangerouslySetInnerHTML={{ __html: gemini_comment }}
        />

        {/* Alert box */}
        <div style={{
          marginTop: 16, borderRadius: "var(--radius-sm)", padding: 16,
          display: "flex", alignItems: "flex-start", gap: 12,
          background: risk.bg, border: `1px solid ${risk.border}`,
        }}>
          {risk.alertIcon}
          <div>
            <p style={{ fontWeight: 600, fontSize: 13, color: risk.color, marginBottom: 2 }}>
              {risk.alertTitle}
            </p>
            <p style={{ fontSize: 12, lineHeight: 1.6, color: "var(--text-secondary)" }}>
              {risk.alertMsg}
            </p>
          </div>
        </div>

        {/* ALO 182 + MHRS — only for pct >= 50 */}
        {pct >= 50 && (
          <div style={{
            marginTop: 16, borderRadius: "var(--radius-sm)", padding: 14,
            background: "rgba(59,130,246,0.06)", border: "1px solid rgba(59,130,246,0.12)",
            display: "flex", flexDirection: "column", gap: 10,
          }}>
            <p style={{ fontSize: 12, fontWeight: 600, color: "var(--text-secondary)", margin: 0 }}>
              Hızlı Erişim
            </p>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
              <a
                href="tel:182"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: "#3b82f6", color: "#fff", textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <Phone size={14} />
                ALO 182
              </a>
              <a
                href="https://www.mhrs.gov.tr/vatandas/?v=1.0.22"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  padding: "8px 16px", borderRadius: 10, fontSize: 13, fontWeight: 600,
                  background: "var(--bg-input)", color: "var(--text-primary)",
                  border: "1px solid var(--border-secondary)", textDecoration: "none",
                  transition: "opacity 0.2s",
                }}
                onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.75")}
                onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              >
                <ExternalLink size={14} />
                MHRS Randevu Al
              </a>
            </div>
            <p style={{ fontSize: 11, color: "var(--text-tertiary)", margin: 0, lineHeight: 1.5 }}>
              Sağlık Bakanlığı ALO 182 hattını arayarak veya MHRS üzerinden nefroloji uzmanından randevu alabilirsiniz.
            </p>
          </div>
        )}
      </div>

      <div style={{ height: 1, background: "var(--border-secondary)" }} />
      <div style={{ padding: "12px 24px", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>Bu uygulama yalnızca bilgilendirme amaçlıdır. Tıbbi tavsiye yerine geçmez.</p>
      </div>
    </div>
  );
}
