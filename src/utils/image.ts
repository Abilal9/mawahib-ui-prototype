import { ImageSource } from 'expo-image';
import { getMediaCacheKey } from '../lib/mediaCacheKey';

export function toImageSource(src: string | number): ImageSource {
  if (typeof src === 'number') {
    return src as ImageSource;
  }
  const cacheKey = getMediaCacheKey(src);
  return cacheKey ? { uri: src, cacheKey } : { uri: src };
}
