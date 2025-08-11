import { useMemo } from 'react';
import { diffToTimeLeft } from '../lib/time';
import type { TimeLeft } from '../types/time';

/** SRP: Converts a target timestamp + current time to countdown state. */
export function useCountdown(targetMs: number | null, nowMs: number) {
  return useMemo<{
    timeLeft: TimeLeft | null;
    finished: boolean;
  }>(() => {
    if (targetMs == null) return { timeLeft: null, finished: false };
    const diff = targetMs - nowMs;
    const finished = diff <= 0;
    const timeLeft = diffToTimeLeft(diff);
    return { timeLeft, finished };
  }, [targetMs, nowMs]);
}
