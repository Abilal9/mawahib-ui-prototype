/**
 * A profile load started with one access token must not apply that result,
 * or sign the device out, after logout or after the session token changed.
 */
export function shouldIgnoreStaleAuthResult(input: {
  epochAtStart: number;
  epochNow: number;
  requestToken: string;
  trackedToken: string | null;
  liveToken: string | null;
}): boolean {
  if (input.epochAtStart !== input.epochNow) return true;
  if (input.trackedToken !== input.requestToken) return true;
  if (input.liveToken !== null && input.liveToken !== input.requestToken) return true;
  return false;
}
