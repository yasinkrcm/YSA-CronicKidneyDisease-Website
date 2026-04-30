"use client";

import { HeartPulse } from "lucide-react";

interface LoadingOverlayProps {
  visible: boolean;
}

export default function LoadingOverlay({ visible }: LoadingOverlayProps) {
  if (!visible) return null;

  return (
    <div style={{
      position: "fixed", inset: 0, zIndex: 9999,
      background: "var(--bg-primary)",
      display: "flex", flexDirection: "column",
      alignItems: "center", justifyContent: "center",
      gap: 28,
      transition: "opacity 0.3s ease",
    }}
      className="animate-fade-in"
    >
      {/* Pulsing Icon */}
      <div style={{ position: "relative" }}>
        {/* Outer ring pulse */}
        <div style={{
          position: "absolute", inset: -16,
          borderRadius: "50%",
          border: "2px solid var(--accent)",
          opacity: 0.15,
          animation: "ringPulse 2s cubic-bezier(0.4,0,0.6,1) infinite",
        }} />
        <div style={{
          position: "absolute", inset: -32,
          borderRadius: "50%",
          border: "1px solid var(--accent)",
          opacity: 0.08,
          animation: "ringPulse 2s cubic-bezier(0.4,0,0.6,1) infinite 0.5s",
        }} />
        
        <div style={{
          width: 72, height: 72, borderRadius: 20,
          background: "linear-gradient(135deg, var(--accent), #5ac8fa)",
          display: "flex", alignItems: "center", justifyContent: "center",
          boxShadow: "0 8px 32px var(--accent-light)",
          animation: "iconPulse 2s ease-in-out infinite",
        }}>
          <HeartPulse size={36} color="#ffffff" />
        </div>
      </div>

      {/* Text */}
      <div style={{ textAlign: "center" }}>
        <p style={{
          fontSize: 18, fontWeight: 700,
          color: "var(--text-primary)",
          marginBottom: 8,
          letterSpacing: "-0.02em",
        }}>
          Analiz Ediliyor
        </p>
        <p style={{
          fontSize: 14, color: "var(--text-secondary)",
          maxWidth: 280, lineHeight: 1.5,
        }}>
          Yapay sinir ağı modeli ve Gemini AI sonuçlarınızı hazırlıyor...
        </p>
      </div>

      {/* Progress dots */}
      <div style={{ display: "flex", gap: 8, marginTop: 4 }}>
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: 8, height: 8,
              borderRadius: "50%",
              background: "var(--accent)",
              animation: `dotBounce 1.4s ease-in-out ${i * 0.16}s infinite`,
            }}
          />
        ))}
      </div>

      {/* Inline keyframes */}
      <style>{`
        @keyframes iconPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.05); }
        }
        @keyframes ringPulse {
          0% { transform: scale(0.8); opacity: 0.15; }
          50% { transform: scale(1.1); opacity: 0; }
          100% { transform: scale(0.8); opacity: 0; }
        }
        @keyframes dotBounce {
          0%, 80%, 100% { transform: translateY(0); opacity: 0.3; }
          40% { transform: translateY(-10px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
