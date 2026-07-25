import React, { useCallback, useMemo, useState, useEffect } from "react";
import "./App.css";
import ThemeToggle from "./components/ThemeToggle";
import CountdownDisplay from "./components/CountdownDisplay";
import DateTimePicker from "./components/DateTimePicker";
import { useTicker } from "./hooks/useTicker";
import { useCountdown } from "./hooks/useCountdown";
import { isFutureDate, isValidDateString, toInputLocal } from "./lib/time";

export default function App() {
  const TARGET_KEY = "countdown-target";
  const [targetValue, setTargetValue] = useState<string>(() => {
    try {
      return window.localStorage.getItem(TARGET_KEY) ?? "";
    } catch {
      return "";
    }
  });
  const [error, setError] = useState<string>("");
  const [pickerNonce, setPickerNonce] = useState(0);
  const [timeFormat, setTimeFormat] = useState<"24h" | "12h">(
    () => {
      try {
        return window.localStorage.getItem("time-format") === "12h" ? "12h" : "24h";
      } catch {
        return "24h";
      }
    }
  );

  const active = Boolean(targetValue) && !error;
  const nowMs = useTicker(active);

  const targetMs = useMemo<number | null>(() => {
    if (!targetValue) return null;
    return new Date(targetValue).getTime();
  }, [targetValue]);

  const { timeLeft, finished } = useCountdown(targetMs, nowMs);

  const handleChange = useCallback((value: string) => {
    if (!isValidDateString(value)) {
      setError("Please enter a valid date and time.");
      setTargetValue("");
      return;
    }
    if (!isFutureDate(value)) {
      setError("Please select a future date and time.");
      setTargetValue("");
      return;
    }
    setError("");
    setTargetValue(value);
  }, []);

  useEffect(() => {
    try {
      if (targetValue) window.localStorage.setItem(TARGET_KEY, targetValue);
      else window.localStorage.removeItem(TARGET_KEY);
    } catch {
      // Persistence is optional when storage is unavailable.
    }
  }, [targetValue]);

  useEffect(() => {
    if (targetValue && (!isValidDateString(targetValue) || !isFutureDate(targetValue))) {
      setError("Saved date/time is in the past. Please pick a new future time.");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setTargetValue("");
    setError("");
    try {
      window.localStorage.removeItem(TARGET_KEY);
    } catch {
      // State still resets when persistence is unavailable.
    }
    setPickerNonce(n => n + 1); // force-remount picker to clear internal UI
  };

  return (
    <div className="App">
      <h1>Countdown Timer</h1>

      <div style={{ display: "flex", justifyContent: "center", marginBottom: 8, flexWrap: "wrap" }}>
        <ThemeToggle />
      </div>

      <div className="controls">
        <DateTimePicker
          key={pickerNonce}
          value={targetValue}
          onChange={handleChange}
          min={toInputLocal(new Date())}
          format={timeFormat}
          onFormatChange={(f) => {
            setTimeFormat(f);
            try {
              window.localStorage.setItem("time-format", f);
            } catch {
              // The selected format remains active for this session.
            }
          }}
        />
        <button className="secondary" onClick={reset} disabled={!targetValue}>Reset</button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {!error && targetValue && timeLeft && !finished && <CountdownDisplay timeLeft={timeLeft} />}
      {!error && finished && <h2 className="done" aria-live="polite">Time’s up! 🎉</h2>}

      <p className="hint">Pick any future local date/time. We block past dates—time travel’s still in beta.</p>
    </div>
  );
}
