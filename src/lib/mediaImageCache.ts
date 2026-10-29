import { Image } from 'expo-image';

/**
 * Drop memory and disk bitmaps. Public and private entries share one cache.
 * AuthProvider awaits this before mounting the next account's tree.
 */
export async function clearMediaImageCache(): Promise<void> {
  await Promise.all([Image.clearMemoryCache(), Image.clearDiskCache()]);
}
