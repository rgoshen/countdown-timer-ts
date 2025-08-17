import React from "react";
import { useTheme, ThemeMode } from "../theme/ThemeProvider";

export default function ThemeToggle() {
  const { mode, setMode, computed } = useTheme();
  return (
    <div style={{ display: "inline-flex", alignItems: "center", gap: 8 }}>
      <label htmlFor="theme-select" style={{ color: "var(--text-muted)" }}>Theme</label>
      <select
        id="theme-select"
        value={mode}
        onChange={(e) => setMode(e.target.value as ThemeMode)}
        aria-label="Theme select"
        style={{ background: "var(--panel)", color: "var(--text)", border: "1px solid var(--border)", borderRadius: 12, padding: "6px 10px" }}
      >
        <option value="system">System</option>
        <option value="light">Light</option>
        <option value="dark">Dark</option>
      </select>
      <span style={{ color: "var(--text-muted)", fontSize: 12 }}>(resolved: {computed})</span>
    </div>
  );
}
