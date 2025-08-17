import { TimeLeft } from "../types/time";

const pad2 = (n: number) => String(n).padStart(2, "0");

export function toInputLocal(d: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  const yyyy = d.getFullYear();
  const mm = p(d.getMonth() + 1);
  const dd = p(d.getDate());
  const hh = p(d.getHours());
  const mi = p(d.getMinutes());
  return `${yyyy}-${mm}-${dd}T${hh}:${mi}`;
}

export function isValidDateString(value: string): boolean {
  const t = new Date(value).getTime();
  return !Number.isNaN(t);
}

export function isFutureDate(value: string | Date): boolean {
  const t = typeof value === "string" ? new Date(value).getTime() : value.getTime();
  return t > Date.now();
}

export function nextTickDelay(nowMs: number): number {
  const mod = nowMs % 1000;
  return mod === 0 ? 1000 : 1000 - mod;
}

export function diffToTimeLeft(diffMs: number): TimeLeft {
  if (diffMs <= 0) {
    return { weeks: 0, days: 0, hours: 0, minutes: 0, seconds: 0 };
  }
  const totalSeconds = Math.floor(diffMs / 1000);
  const seconds = totalSeconds % 60;
  const totalMinutes = Math.floor(totalSeconds / 60);
  const minutes = totalMinutes % 60;
  const totalHours = Math.floor(totalMinutes / 60);
  const hours = totalHours % 24;
  const totalDays = Math.floor(totalHours / 24);
  const weeks = Math.floor(totalDays / 7);
  const days = totalDays % 7;
  return { weeks, days, hours, minutes, seconds };
}

export function formatTwoDigits(left: TimeLeft): TimeLeft & { hours: string; minutes: string; seconds: string } {
  return {
    ...left,
    hours: pad2(left.hours),
    minutes: pad2(left.minutes),
    seconds: pad2(left.seconds),
  };
}
