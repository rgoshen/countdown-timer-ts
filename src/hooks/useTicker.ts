import { useEffect, useState } from "react";
import { nextTickDelay } from "../lib/time";

/** SRP: Emits a now() timestamp aligned to whole seconds. */
export function useTicker(active: boolean): number {
  const [now, setNow] = useState<number>(Date.now());

  useEffect(() => {
    if (!active) return;
    let timer: ReturnType<typeof setTimeout> | undefined;

    const schedule = () => {
      const n = Date.now();
      setNow(n);
      timer = setTimeout(schedule, nextTickDelay(n));
    };

    timer = setTimeout(schedule, nextTickDelay(Date.now()));
    return () => timer && clearTimeout(timer);
  }, [active]);

  return now;
}
