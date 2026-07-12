import { ImageSource } from 'expo-image';

export function toImageSource(src: string | number): ImageSource {
  if (typeof src === 'number') {
    return src as ImageSource;
  }
  return { uri: src };
}
