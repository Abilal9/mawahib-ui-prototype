import * as ImagePicker from 'expo-image-picker';
import * as FileSystem from 'expo-file-system/legacy';
import { mediaApi, type MediaPurpose } from '../services/mediaApi';

export type PickedUpload = {
  /** Local preview URI while uploading / after */
  uri: string;
  mediaAssetId: string;
  remoteUrl: string;
};

function guessMime(uri: string, pickerType?: string | null): string {
  if (pickerType && pickerType.includes('/')) return pickerType;
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/jpeg';
  return 'image/jpeg';
}

async function ensureLibraryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

/**
 * Pick one image from the library and upload via Nest signed URL flow.
 */
export async function pickAndUploadImage(
  purpose: MediaPurpose,
  onProgress?: (ratio: number) => void,
): Promise<PickedUpload | null> {
  const ok = await ensureLibraryPermission();
  if (!ok) {
    throw new Error('Photo library permission is required to upload images');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsMultipleSelection: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const mimeType = guessMime(asset.uri, asset.mimeType);
  const byteSize = asset.fileSize ?? (await fileSize(asset.uri));
  const fileName = asset.fileName ?? `upload${extensionForMime(mimeType)}`;

  onProgress?.(0.05);
  const session = await mediaApi.createUploadSession({
    purpose,
    mimeType,
    byteSize,
    fileName,
  });
  onProgress?.(0.2);

  const upload = await FileSystem.uploadAsync(session.uploadUrl, asset.uri, {
    httpMethod: 'PUT',
    uploadType: FileSystem.FileSystemUploadType.BINARY_CONTENT,
    headers: {
      'Content-Type': mimeType,
      'x-upsert': 'false',
    },
  });

  if (upload.status < 200 || upload.status >= 300) {
    throw new Error(`Storage upload failed (${upload.status})`);
  }
  onProgress?.(0.85);

  const completed = await mediaApi.completeUpload(session.mediaAssetId);
  if (!completed.url) {
    throw new Error('Upload completed but no media URL was returned');
  }
  onProgress?.(1);

  return {
    uri: completed.url,
    mediaAssetId: completed.id,
    remoteUrl: completed.url,
  };
}

async function fileSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (info.exists && 'size' in info && typeof info.size === 'number') {
    return info.size;
  }
  return 1;
}

function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    default:
      return '.jpg';
  }
}
