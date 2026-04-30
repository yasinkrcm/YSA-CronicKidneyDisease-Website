"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/providers";

export default function ThemeToggle() {
  const { theme, toggle } = useTheme();

  return (
    <button
      onClick={toggle}
      className="apple-btn apple-btn-ghost"
      style={{ padding: "8px", borderRadius: "50%" }}
      aria-label="Tema değiştir"
    >
      {theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
    </button>
  );
}
