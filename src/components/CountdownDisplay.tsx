import CountdownUnit from './CountdownUnit';
import type { TimeLeft } from '../types/time';
import { formatTwoDigits } from '../lib/time';

type Props = Readonly<{ timeLeft: TimeLeft }>;

export default function CountdownDisplay({ timeLeft }: Props) {
  const padded = formatTwoDigits(timeLeft);

  return (
    <div className='timer' aria-live='polite'>
      <CountdownUnit label='Weeks' value={padded.weeks} />
      <CountdownUnit label='Days' value={padded.days} />
      <CountdownUnit label='Hours' value={padded.hours} />
      <CountdownUnit label='Minutes' value={padded.minutes} />
      <CountdownUnit label='Seconds' value={padded.seconds} />
    </div>
  );
}
