import { useEffect, useRef } from 'react';

/**
 * Calls `callback` immediately when enabled, then on an interval while focused/enabled.
 * Skips overlapping runs if a previous tick is still in flight.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled: boolean,
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;

  useEffect(() => {
    if (!enabled || intervalMs <= 0) return;

    let cancelled = false;
    let inFlight = false;

    const tick = async () => {
      if (cancelled || inFlight) return;
      inFlight = true;
      try {
        await callbackRef.current();
      } catch {
        // Callers handle their own errors; never break the poll loop.
      } finally {
        inFlight = false;
      }
    };

    void tick();
    const id = setInterval(() => {
      void tick();
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, intervalMs]);
}
