import React from "react";
import CountdownUnit from "./CountdownUnit";
import { TimeLeft } from "../types/time";
import { formatTwoDigits } from "../lib/time";
type Props = { timeLeft: TimeLeft };
export default function CountdownDisplay({ timeLeft }: Props) {
  const padded = formatTwoDigits(timeLeft);
  return (
    <div className="timer" aria-live="polite">
      <CountdownUnit label="Weeks"   value={padded.weeks} />
      <CountdownUnit label="Days"    value={padded.days} />
      <CountdownUnit label="Hours"   value={padded.hours} />
      <CountdownUnit label="Minutes" value={padded.minutes} />
      <CountdownUnit label="Seconds" value={padded.seconds} />
    </div>
  );
}
