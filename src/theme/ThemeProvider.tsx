import React, { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
type Resolved = "light" | "dark";

type Ctx = {
  mode: ThemeMode;
  setMode: (m: ThemeMode) => void;
  computed: Resolved;
};

const ThemeContext = createContext<Ctx | null>(null);
const STORAGE_KEY = "theme-mode";

function getSystemTheme(): Resolved {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return saved ?? "system";
  });

  const mqRef = useRef<MediaQueryList | null>(null);
  const computed: Resolved = useMemo(() => {
    return mode === "system" ? getSystemTheme() : mode;
  }, [mode]);

  // Apply theme attribute & persist mode
  useEffect(() => {
    if (typeof document !== "undefined") {
      document.documentElement.setAttribute("data-theme", computed);
    }
    if (typeof window !== "undefined") {
      window.localStorage.setItem(STORAGE_KEY, mode);
    }
  }, [computed, mode]);

  // React to system changes when in 'system' mode
  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    mqRef.current = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => {
      const next = getSystemTheme();
      document.documentElement.setAttribute("data-theme", next);
    };
    mqRef.current.addEventListener?.("change", handler);
    return () => mqRef.current?.removeEventListener?.("change", handler);
  }, [mode]);

  const value = useMemo<Ctx>(() => ({ mode, setMode, computed }), [mode, computed]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
