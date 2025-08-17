import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type ThemeMode = "light" | "dark" | "system";
type Resolved = "light" | "dark";
type Ctx = { mode: ThemeMode; setMode: (m: ThemeMode) => void; computed: Resolved; };

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

  const computed: Resolved = useMemo(() => (mode === "system" ? getSystemTheme() : mode), [mode]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", computed);
    window.localStorage.setItem(STORAGE_KEY, mode);
  }, [computed, mode]);

  useEffect(() => {
    if (mode !== "system" || typeof window === "undefined" || !window.matchMedia) return;
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const handler = () => document.documentElement.setAttribute("data-theme", getSystemTheme());
    mq.addEventListener?.("change", handler);
    return () => mq.removeEventListener?.("change", handler);
  }, [mode]);

  return <ThemeContext.Provider value={{ mode, setMode, computed }}>{children}</ThemeContext.Provider>;
};

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
