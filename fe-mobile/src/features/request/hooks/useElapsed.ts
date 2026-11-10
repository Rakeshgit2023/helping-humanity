import { useEffect, useState } from 'react';

/** Whole seconds since `since` (epoch ms). Re-renders twice a second. */
export function useElapsed(since: number | null): number {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 500);
    return () => clearInterval(t);
  }, []);

  return since ? Math.max(0, Math.floor((now - since) / 1000)) : 0;
}
