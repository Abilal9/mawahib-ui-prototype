/** Nest / Postgres user ids are UUID v4. */
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isBackendUserId(id: string | null | undefined): boolean {
  return Boolean(id && UUID_RE.test(id));
}
