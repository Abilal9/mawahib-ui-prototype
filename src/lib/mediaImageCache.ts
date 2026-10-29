import { Image } from 'expo-image';

/**
 * Drop memory and disk bitmaps. Public and private entries share one cache.
 * Callers must treat a thrown error as a failed clear. Never mark ready in
 * `finally`.
 */
export async function clearMediaImageCache(): Promise<void> {
  await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);
}
