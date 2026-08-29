/** Home feed multi-image preview: 1 primary + up to 3 thumbnails. */
export const FEED_MEDIA_PREVIEW_MAX = 4;

export type PostMediaPreviewLayout = {
  /** Ordered URLs already filtered to non-empty. */
  primary: string | null;
  /** media[1]..media[3] (max 3). */
  thumbnails: string[];
  /** Hidden images beyond primary + 3 thumbs. */
  remainingCount: number;
  total: number;
};

/**
 * Derive LinkedIn-style Home preview slots from ordered post images.
 * Input must already be position-ordered (media[0] = primary).
 */
export function getPostMediaPreviewLayout(
  images: Array<string | null | undefined>,
): PostMediaPreviewLayout {
  const urls = images.filter((u): u is string => Boolean(u?.trim()));
  const total = urls.length;
  return {
    primary: urls[0] ?? null,
    thumbnails: urls.slice(1, FEED_MEDIA_PREVIEW_MAX),
    remainingCount: Math.max(total - FEED_MEDIA_PREVIEW_MAX, 0),
    total,
  };
}
