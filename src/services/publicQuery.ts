/** Mirror of Phase D public pagination caps. */
export const PUBLIC_DEFAULT_TAKE = 20;
export const PUBLIC_MAX_TAKE = 20;
export const PUBLIC_MAX_SKIP = 200;
export const PUBLIC_Q_MIN_LENGTH = 2;
export const PUBLIC_Q_MAX_LENGTH = 120;

export type PublicCursorQuery = {
  cursor?: string | null;
  take?: number;
};

export type PublicSearchQuery = {
  q?: string;
  skip?: number;
  take?: number;
};

function clampTake(take: number | undefined): number {
  const next = take ?? PUBLIC_DEFAULT_TAKE;
  return Math.max(1, Math.min(next, PUBLIC_MAX_TAKE));
}

function clampSkip(skip: number | undefined): number {
  const next = skip ?? 0;
  return Math.max(0, Math.min(next, PUBLIC_MAX_SKIP));
}

function toQuery(
  params: Record<string, string | number | undefined | null>,
): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

/** Cursor pages. Omits empty cursor. Caps take at 20. */
export function buildPublicCursorQuery(input: PublicCursorQuery = {}): string {
  return toQuery({
    cursor: input.cursor || undefined,
    take: clampTake(input.take),
  });
}

/**
 * Offset search/browse. Omits `q` when missing or shorter than 2.
 * Never sends authenticated extras (status, sort, categoryIds, locationCode).
 */
export function buildPublicSearchQuery(input: PublicSearchQuery = {}): string {
  const raw = input.q?.trim() ?? '';
  const q =
    raw.length >= PUBLIC_Q_MIN_LENGTH
      ? raw.slice(0, PUBLIC_Q_MAX_LENGTH)
      : undefined;
  return toQuery({
    q,
    skip: clampSkip(input.skip),
    take: clampTake(input.take),
  });
}
