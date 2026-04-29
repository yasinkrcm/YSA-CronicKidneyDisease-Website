"use client";

// HeroUI v3 doesn't require a provider wrapper for basic usage
// Components work directly

export function Providers({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
