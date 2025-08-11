import React, { useMemo, useState } from 'react';
import './App.css';
import CountdownDisplay from './components/CountdownDisplay';
import { useTicker } from './hooks/useTicker';
import { useCountdown } from './hooks/useCountdown';
import { isFutureDate, isValidDateString, toInputLocal } from './lib/time';

export default function App() {
  const [targetValue, setTargetValue] = useState<string>('');
  const [error, setError] = useState<string>('');

  const active = Boolean(targetValue) && !error;
  const nowMs = useTicker(active);

  const targetMs = useMemo<number | null>(() => {
    if (!targetValue) return null;
    return new Date(targetValue).getTime();
  }, [targetValue]);

  const { timeLeft, finished } = useCountdown(targetMs, nowMs);

  const handleChange: React.ChangeEventHandler<HTMLInputElement> = (e) => {
    const value = e.target.value;
    if (!isValidDateString(value)) {
      setError('Please enter a valid date and time.');
      setTargetValue('');
      return;
    }
    if (!isFutureDate(value)) {
      setError('Please select a future date and time.');
      setTargetValue('');
      return;
    }
    setError('');
    setTargetValue(value);
  };

  const reset = () => {
    setTargetValue('');
    setError('');
  };

  return (
    <div className='App'>
      <h1>Countdown Timer</h1>

      <div className='controls'>
        <input
          type='datetime-local'
          value={targetValue}
          onChange={handleChange}
          min={toInputLocal(new Date())}
          aria-label='Choose future date and time'
        />
        <button className='secondary' onClick={reset} disabled={!targetValue}>
          Reset
        </button>
      </div>

      {error && (
        <p className='error' role='alert'>
          {error}
        </p>
      )}

      {!error && targetValue && timeLeft && !finished && (
        <CountdownDisplay timeLeft={timeLeft} />
      )}

      {!error && finished && (
        <h2 className='done' aria-live='polite'>
          Time’s up! 🎉
        </h2>
      )}

      <p className='hint'>
        Pick any future local date/time. We block past dates—time travel’s still
        in beta.
      </p>
    </div>
  );
}
