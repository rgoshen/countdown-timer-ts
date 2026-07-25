import React, { useEffect, useMemo, useState } from "react";
import { ThemeContext, ThemeMode, ResolvedTheme } from "./themeContext";

const STORAGE_KEY = "theme-mode";

function getSystemTheme(): ResolvedTheme {
  if (typeof window === "undefined" || !window.matchMedia) return "light";
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
}

export const ThemeProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [mode, setMode] = useState<ThemeMode>(() => {
    if (typeof window === "undefined") return "system";
    const saved = window.localStorage.getItem(STORAGE_KEY) as ThemeMode | null;
    return saved ?? "system";
  });

  const computed: ResolvedTheme = useMemo(() => (mode === "system" ? getSystemTheme() : mode), [mode]);

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
