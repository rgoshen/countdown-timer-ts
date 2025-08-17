import React from "react";
import CountdownUnit from "./CountdownUnit";
import { TimeLeft } from "../types/time";
import { withPadded } from "../lib/time";
type Props = { timeLeft: TimeLeft };
export default function CountdownDisplay({ timeLeft }: Props) {
  const padded = withPadded(timeLeft);
  return (
    <div className="timer" aria-live="polite">
      <CountdownUnit label="Weeks"   value={padded.weeks} />
      <CountdownUnit label="Days"    value={padded.days} />
      <CountdownUnit label="Hours"   value={padded.hoursStr} />
      <CountdownUnit label="Minutes" value={padded.minutesStr} />
      <CountdownUnit label="Seconds" value={padded.secondsStr} />
    </div>
  );
}
