import { useEffect, useRef } from 'react';

/**
 * Calls `callback` on an interval while enabled.
 * The first tick runs immediately unless `immediate` is false, so a screen
 * that already loads on focus does not fire a second identical request.
 * Skips overlapping runs if a previous tick is still in flight.
 */
export function usePolling(
  callback: () => void | Promise<void>,
  intervalMs: number,
  enabled: boolean,
  options?: { immediate?: boolean },
): void {
  const callbackRef = useRef(callback);
  callbackRef.current = callback;
  const immediate = options?.immediate !== false;

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

    if (immediate) void tick();
    const id = setInterval(() => {
      void tick();
    }, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [enabled, intervalMs, immediate]);
}
