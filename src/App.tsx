import React, { useMemo, useState, useEffect } from 'react';
import './App.css';
import CountdownDisplay from './components/CountdownDisplay';
import { useTicker } from './hooks/useTicker';
import { useCountdown } from './hooks/useCountdown';
import { isFutureDate, isValidDateString, toInputLocal } from './lib/time';

export default function App() {
  const [targetValue, setTargetValue] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

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
      <div style={{ position: 'absolute', top: 20, right: 20 }}>
        <button 
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          style={{ 
            background: 'rgba(255,255,255,0.2)', 
            border: 'none', 
            borderRadius: '50%', 
            width: 50, 
            height: 50, 
            fontSize: '1.5rem',
            cursor: 'pointer'
          }}
        >
          {theme === 'dark' ? '☀️' : '🌙'}
        </button>
      </div>
      
      <h1>⏰ Countdown Timer</h1>

      <div className='controls'>
        <input
          type='datetime-local'
          value={targetValue}
          onChange={handleChange}
          min={toInputLocal(new Date())}
          aria-label='Choose future date and time'
        />
        <button className='secondary' onClick={reset} disabled={!targetValue}>
          🔄 Reset
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
