/** Best-effort UUID for idempotent client message ids. */
export function createClientId(): string {
  const c = globalThis.crypto;
  if (c && typeof c.randomUUID === 'function') {
    return c.randomUUID();
  }
  return `c-${Date.now()}-${Math.random().toString(36).slice(2, 11)}`;
}
