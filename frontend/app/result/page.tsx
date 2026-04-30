"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import ResultCard from "@/components/ResultCard";
import ThemeToggle from "@/components/ThemeToggle";
import { PredictionResponse } from "@/lib/api";
import { ArrowLeft, HeartPulse } from "lucide-react";

function ResultSkeleton() {
  const shimmer = "animate-pulse rounded-lg";
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 0 }}>
      <div className="apple-card" style={{ overflow: "hidden" }}>
        {/* Header skeleton */}
        <div style={{ padding: "24px 24px 20px" }}>
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
              <div className={shimmer} style={{ width: 44, height: 44, borderRadius: 12, background: "var(--bg-input)" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                <div className={shimmer} style={{ width: 100, height: 10, background: "var(--bg-input)" }} />
                <div className={shimmer} style={{ width: 220, height: 18, background: "var(--bg-input)" }} />
              </div>
            </div>
            <div className={shimmer} style={{ width: 80, height: 30, borderRadius: 20, background: "var(--bg-input)" }} />
          </div>
          <div style={{ marginTop: 20 }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 6 }}>
              <div className={shimmer} style={{ width: 120, height: 10, background: "var(--bg-input)" }} />
              <div className={shimmer} style={{ width: 36, height: 10, background: "var(--bg-input)" }} />
            </div>
            <div className={shimmer} style={{ width: "100%", height: 6, background: "var(--bg-input)" }} />
          </div>
        </div>

        <div style={{ height: 1, background: "var(--border-secondary)" }} />

        {/* AI Comment skeleton */}
        <div style={{ padding: "20px 24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
            <div className={shimmer} style={{ width: 18, height: 18, borderRadius: "50%", background: "var(--bg-input)" }} />
            <div className={shimmer} style={{ width: 180, height: 14, background: "var(--bg-input)" }} />
            <div className={shimmer} style={{ width: 60, height: 18, borderRadius: 10, background: "var(--bg-input)" }} />
          </div>

          <div style={{ borderRadius: "var(--radius-sm)", background: "var(--bg-input)", border: "1px solid var(--border-secondary)", padding: "16px 20px" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              <div className={shimmer} style={{ width: "60%", height: 14, background: "var(--bg-tertiary)" }} />
              <div className={shimmer} style={{ width: "100%", height: 11, background: "var(--bg-tertiary)" }} />
              <div className={shimmer} style={{ width: "85%", height: 11, background: "var(--bg-tertiary)" }} />
              <div className={shimmer} style={{ width: "90%", height: 11, background: "var(--bg-tertiary)" }} />
              <div style={{ height: 4 }} />
              <div className={shimmer} style={{ width: "50%", height: 14, background: "var(--bg-tertiary)" }} />
              <div style={{ paddingLeft: 16, display: "flex", flexDirection: "column", gap: 8 }}>
                <div className={shimmer} style={{ width: "80%", height: 11, background: "var(--bg-tertiary)" }} />
                <div className={shimmer} style={{ width: "70%", height: 11, background: "var(--bg-tertiary)" }} />
                <div className={shimmer} style={{ width: "75%", height: 11, background: "var(--bg-tertiary)" }} />
                <div className={shimmer} style={{ width: "65%", height: 11, background: "var(--bg-tertiary)" }} />
              </div>
              <div style={{ height: 4 }} />
              <div className={shimmer} style={{ width: "40%", height: 14, background: "var(--bg-tertiary)" }} />
              <div className={shimmer} style={{ width: "95%", height: 11, background: "var(--bg-tertiary)" }} />
              <div className={shimmer} style={{ width: "80%", height: 11, background: "var(--bg-tertiary)" }} />
            </div>
          </div>

          {/* Alert skeleton */}
          <div style={{ marginTop: 16, borderRadius: "var(--radius-sm)", padding: 16, display: "flex", alignItems: "flex-start", gap: 12, background: "var(--bg-input)", border: "1px solid var(--border-secondary)" }}>
            <div className={shimmer} style={{ width: 24, height: 24, borderRadius: "50%", background: "var(--bg-tertiary)", flexShrink: 0 }} />
            <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: 6 }}>
              <div className={shimmer} style={{ width: 160, height: 12, background: "var(--bg-tertiary)" }} />
              <div className={shimmer} style={{ width: "100%", height: 10, background: "var(--bg-tertiary)" }} />
              <div className={shimmer} style={{ width: "70%", height: 10, background: "var(--bg-tertiary)" }} />
            </div>
          </div>
        </div>

        <div style={{ height: 1, background: "var(--border-secondary)" }} />
        <div style={{ padding: "12px 24px", textAlign: "center" }}>
          <div className={shimmer} style={{ width: 300, height: 10, background: "var(--bg-input)", margin: "0 auto" }} />
        </div>
      </div>

      {/* Loading indicator */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 12, padding: "20px 0" }}>
        <div style={{ display: "flex", gap: 6 }}>
          <span className="animate-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animationDelay: "0ms", display: "inline-block" }} />
          <span className="animate-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animationDelay: "150ms", display: "inline-block" }} />
          <span className="animate-bounce" style={{ width: 6, height: 6, borderRadius: "50%", background: "var(--accent)", animationDelay: "300ms", display: "inline-block" }} />
        </div>
        <p style={{ fontSize: 13, color: "var(--text-secondary)" }} className="animate-pulse">
          Yapay zeka analiz ediyor, lütfen bekleyiniz...
        </p>
      </div>
    </div>
  );
}

export default function ResultPage() {
  const router = useRouter();
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const raw = sessionStorage.getItem("kidney_result");
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as PredictionResponse;
        setTimeout(() => {
          setResult(parsed);
          setLoading(false);
        }, 800);
      } catch {
        router.replace("/");
      }
    } else {
      router.replace("/");
    }
  }, [router]);

  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-primary)", padding: "40px 16px", transition: "background 0.3s ease" }}>
      {/* Header */}
      <div style={{ maxWidth: 800, margin: "0 auto 24px" }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 12 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: "linear-gradient(135deg, var(--accent), #5ac8fa)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 2px 8px var(--accent-light)",
            }}>
              <HeartPulse size={20} color="#ffffff" />
            </div>
            <div>
              <p style={{ fontSize: 10, color: "var(--text-tertiary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Böbrek Hastalığı Analizi</p>
              <h1 style={{ fontSize: 18, fontWeight: 700, color: "var(--text-primary)" }}>Analiz Sonucu</h1>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <ThemeToggle />
            <button className="apple-btn apple-btn-ghost" onClick={() => router.push("/")}>
              <ArrowLeft size={16} /> Yeni Analiz
            </button>
          </div>
        </div>
        <div style={{ height: 1, background: "var(--border-secondary)", marginTop: 16 }} />
      </div>

      {/* Content */}
      <div style={{ maxWidth: 800, margin: "0 auto" }}>
        {loading ? (
          <ResultSkeleton />
        ) : result ? (
          <div className="animate-fade-in">
            <ResultCard
              prediction={result.prediction}
              prediction_label={result.prediction_label}
              confidence={result.confidence}
              gemini_comment={result.gemini_comment}
            />
          </div>
        ) : null}
      </div>

      <div style={{ maxWidth: 800, margin: "24px auto 0", textAlign: "center" }}>
        <p style={{ fontSize: 11, color: "var(--text-tertiary)" }}>
          Bu uygulama yalnızca bilgilendirme amaçlıdır ve tıbbi tavsiye yerine geçmez.
        </p>
      </div>
    </div>
  );
}
