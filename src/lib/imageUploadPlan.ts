export const AVATAR_MAX_EDGE = 512;
export const PHOTO_MAX_EDGE = 1600;
export const UPLOAD_IMAGE_QUALITY = 0.85;

const PHOTO_PURPOSES = new Set(['post', 'portfolio', 'service', 'message']);

export type UploadImageFormat = 'jpeg' | 'png' | 'webp';

export type UploadResizePlan =
  | { resize: false }
  | {
      resize: true;
      maxEdge: number;
      format: UploadImageFormat;
      width: number;
      height: number;
    };

function maxEdgeForPurpose(purpose: string): number | null {
  if (purpose === 'avatar') return AVATAR_MAX_EDGE;
  if (PHOTO_PURPOSES.has(purpose)) return PHOTO_MAX_EDGE;
  return null;
}

function formatForMime(mimeType: string): UploadImageFormat | null {
  if (mimeType === 'image/png') return 'png';
  if (mimeType === 'image/webp') return 'webp';
  if (
    mimeType === 'image/jpeg' ||
    mimeType === 'image/jpg' ||
    mimeType === 'image/heic' ||
    mimeType === 'image/heif'
  ) {
    return 'jpeg';
  }
  return null;
}

/**
 * Decide whether a new upload should be scaled down.
 * PDFs, video, GIF, and already-small images are left untouched.
 * Only one side of the resize is required; the other follows the aspect ratio.
 */
export function planUploadResize(input: {
  purpose: string;
  mimeType: string;
  width?: number | null;
  height?: number | null;
}): UploadResizePlan {
  const mimeType = input.mimeType.trim().toLowerCase();
  const maxEdge = maxEdgeForPurpose(input.purpose);
  const format = formatForMime(mimeType);
  const width = input.width ?? 0;
  const height = input.height ?? 0;
  if (!maxEdge || !format || width < 1 || height < 1) return { resize: false };
  const heic = mimeType === 'image/heic' || mimeType === 'image/heif';
  if (width <= maxEdge && height <= maxEdge) {
    if (!heic) return { resize: false };
    return {
      resize: true,
      maxEdge: Math.max(width, height),
      format: 'jpeg',
      width,
      height,
    };
  }
  const scale = maxEdge / Math.max(width, height);
  return {
    resize: true,
    maxEdge,
    format,
    width: Math.max(1, Math.round(width * scale)),
    height: Math.max(1, Math.round(height * scale)),
  };
}
