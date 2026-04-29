"use client";

import InputForm from "@/components/InputForm";
import ThemeToggle from "@/components/ThemeToggle";
import { HeartPulse, Sparkles } from "lucide-react";

export default function Home() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "40px 16px", transition: "background 0.3s ease" }}>
      {/* Top bar */}
      <div style={{ maxWidth: 900, margin: "0 auto", display: "flex", justifyContent: "flex-end", marginBottom: 16 }}>
        <ThemeToggle />
      </div>

      {/* Hero Header */}
      <div style={{ maxWidth: 900, margin: "0 auto 32px", textAlign: "center" }}>
        <div style={{
          width: 56, height: 56, borderRadius: 16,
          background: "linear-gradient(135deg, var(--accent), #5ac8fa)",
          display: "inline-flex", alignItems: "center", justifyContent: "center",
          marginBottom: 16,
          boxShadow: "0 4px 16px var(--accent-light)",
        }}>
          <HeartPulse size={28} color="#ffffff" />
        </div>

        <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: 10, flexWrap: "wrap", marginBottom: 10 }}>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 38px)", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.03em", lineHeight: 1.2 }}>
            Böbrek Hastalığı Analizi
          </h1>
          <span style={{
            display: "inline-flex", alignItems: "center", gap: 4,
            padding: "4px 10px", borderRadius: 12, fontSize: 11, fontWeight: 600,
            background: "var(--accent-light)", color: "var(--accent)",
          }}>
            <Sparkles size={12} /> AI Destekli
          </span>
        </div>

        <p style={{ fontSize: 15, color: "var(--text-secondary)", maxWidth: 480, margin: "0 auto", lineHeight: 1.6 }}>
          Yapay sinir ağı modeli ve Gemini AI yorumlaması ile böbrek hastalığı riskini analiz edin.
        </p>

        <div style={{ height: 1, background: "var(--border-secondary)", margin: "24px auto 0", maxWidth: 400 }} />
      </div>

      {/* Form */}
      <InputForm />

      {/* Footer */}
      <div style={{ maxWidth: 900, margin: "32px auto 0", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          Bu uygulama yalnızca bilgilendirme amaçlıdır ve tıbbi tavsiye yerine geçmez.
        </p>
      </div>
    </div>
  );
}
