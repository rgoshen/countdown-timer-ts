import React, { useMemo, useState } from "react";
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
    try { return localStorage.getItem(TARGET_KEY) ?? ""; } catch { return ""; }
  });
  const [error, setError] = useState<string>("");
  const [timeFormat, setTimeFormat] = useState<"24h"|"12h">(() => (localStorage.getItem("time-format") === "12h" ? "12h" : "24h"));

  const active = Boolean(targetValue) && !error;
  const nowMs = useTicker(active);

  const targetMs = useMemo<number | null>(() => {
    if (!targetValue) return null;
    return new Date(targetValue).getTime();
  }, [targetValue]);

  const { timeLeft, finished } = useCountdown(targetMs, nowMs);

  const handleChange = (value: string) => {
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
  };

  // Persist targetValue whenever it changes
  React.useEffect(() => {
    try {
      if (targetValue) localStorage.setItem(TARGET_KEY, targetValue);
      else localStorage.removeItem(TARGET_KEY);
    } catch {}
  }, [targetValue]);

  // If a saved time is now invalid/past, show a friendly message
  React.useEffect(() => {
    if (targetValue && (!isValidDateString(targetValue) || !isFutureDate(targetValue))) {
      setError("Saved date/time is in the past. Please pick a new future time.");
    }
    // run once on mount
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const reset = () => {
    setTargetValue("");
    setError("");
    try { localStorage.removeItem(TARGET_KEY); } catch {}
  };

  return (
    <div className="App">
      <h1>Countdown Timer</h1>

      <div style={{ display: 'flex', justifyContent: 'center', marginBottom: 8 }}>
        <ThemeToggle />
      </div>

      <div className="controls">
        <DateTimePicker value={targetValue} onChange={handleChange as any} min={toInputLocal(new Date())} />
        <button className="secondary" onClick={reset} disabled={!targetValue}>
          Reset
        </button>
      </div>

      {error && <p className="error" role="alert">{error}</p>}

      {!error && targetValue && timeLeft && !finished && (
        <CountdownDisplay timeLeft={timeLeft} />
      )}

      {!error && finished && (
        <h2 className="done" aria-live="polite">Time’s up! 🎉</h2>
      )}

      <p className="hint">
        Pick any future local date/time. We block past dates—time travel’s still in beta.
      </p>
    </div>
  );
}
