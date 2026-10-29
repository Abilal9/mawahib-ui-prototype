import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import * as FileSystem from 'expo-file-system/legacy';
import { Image as RNImage } from 'react-native';
import { planUploadResize, UPLOAD_IMAGE_QUALITY } from './imageUploadPlan';
import {
  captureAuthenticatedPrincipal,
  StaleIdentityError,
} from './apiClient';
import { principalsEqual } from './requestPrincipal';
import { mediaApi, type MediaPurpose } from '../services/mediaApi';

export type PickedUpload = {
  /** Local preview URI while uploading / after */
  uri: string;
  mediaAssetId: string;
  remoteUrl: string;
};

/** Local pick only — no network upload until `uploadLocalFile` / send. */
export type LocalPickedFile = {
  uri: string;
  mimeType: string;
  byteSize: number;
  fileName: string;
  width?: number;
  height?: number;
};

function guessMime(uri: string, pickerType?: string | null): string {
  if (pickerType && pickerType.includes('/')) return pickerType;
  const lower = uri.toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.gif')) return 'image/gif';
  if (lower.endsWith('.heic') || lower.endsWith('.heif')) return 'image/jpeg';
  if (lower.endsWith('.pdf')) return 'application/pdf';
  return 'image/jpeg';
}

async function ensureLibraryPermission(): Promise<boolean> {
  const current = await ImagePicker.getMediaLibraryPermissionsAsync();
  if (current.granted) return true;
  const requested = await ImagePicker.requestMediaLibraryPermissionsAsync();
  return requested.granted;
}

/**
 * Pick one or more photos in a single library session.
 * `selectionLimit` is the remaining room in the message, not an unlimited pick.
 * Cancel returns an empty list.
 */
export async function pickLocalImages(
  selectionLimit: number,
): Promise<LocalPickedFile[]> {
  if (selectionLimit < 1) return [];
  const ok = await ensureLibraryPermission();
  if (!ok) {
    throw new Error('Photo library permission is required to upload images');
  }

  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    quality: 0.85,
    allowsMultipleSelection: true,
    selectionLimit,
  });
  if (result.canceled || !result.assets?.length) return [];

  const selected = result.assets.slice(0, selectionLimit);
  const files: LocalPickedFile[] = [];
  for (const asset of selected) {
    const mimeType = guessMime(asset.uri, asset.mimeType);
    const byteSize = asset.fileSize ?? (await fileSize(asset.uri));
    const fileName = asset.fileName ?? `upload${extensionForMime(mimeType)}`;
    files.push({
      uri: asset.uri,
      mimeType,
      byteSize,
      fileName,
      width: positivePixel(asset.width),
      height: positivePixel(asset.height),
    });
  }
  return files;
}

/** Pick an image without uploading. */
export async function pickLocalImage(): Promise<LocalPickedFile | null> {
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
  return {
    uri: asset.uri,
    mimeType,
    byteSize,
    fileName,
    width: positivePixel(asset.width),
    height: positivePixel(asset.height),
  };
}

/** Pick a PDF/document without uploading. */
export async function pickLocalDocument(): Promise<LocalPickedFile | null> {
  const DocumentPicker = await import('expo-document-picker');
  const result = await DocumentPicker.getDocumentAsync({
    type: ['application/pdf', 'image/*'],
    copyToCacheDirectory: true,
    multiple: false,
  });
  if (result.canceled || !result.assets?.[0]) return null;

  const asset = result.assets[0];
  const mimeType = asset.mimeType?.includes('/')
    ? asset.mimeType
    : asset.name?.toLowerCase().endsWith('.pdf')
      ? 'application/pdf'
      : 'application/pdf';
  const byteSize = asset.size ?? (await fileSize(asset.uri));
  const fileName = asset.name ?? `upload${extensionForMime(mimeType)}`;
  return { uri: asset.uri, mimeType, byteSize, fileName };
}

/**
 * Pick one image from the library and upload via Nest signed URL flow.
 * Prefer `pickLocalImage` + `uploadLocalFile` for chat compose preview.
 */
export async function pickAndUploadImage(
  purpose: MediaPurpose,
  onProgress?: (ratio: number) => void,
): Promise<PickedUpload | null> {
  const local = await pickLocalImage();
  if (!local) return null;
  return uploadLocalFile({ ...local, purpose, onProgress });
}

/**
 * Pick a PDF (or image) document and upload via Nest signed URL flow.
 * Prefer `pickLocalDocument` + `uploadLocalFile` for chat compose preview.
 */
export async function pickAndUploadDocument(
  purpose: MediaPurpose,
  onProgress?: (ratio: number) => void,
): Promise<PickedUpload | null> {
  const local = await pickLocalDocument();
  if (!local) return null;
  return uploadLocalFile({ ...local, purpose, onProgress });
}

export async function uploadLocalFile(input: {
  uri: string;
  mimeType: string;
  byteSize: number;
  fileName: string;
  purpose: MediaPurpose;
  width?: number;
  height?: number;
  onProgress?: (ratio: number) => void;
}): Promise<PickedUpload> {
  const prepared = await prepareImageForUpload(input);
  const { purpose, onProgress } = input;
  const { uri, mimeType, fileName } = prepared;
  // Always measure the file being uploaded — never trust a stale/placeholder size.
  const byteSize = await requireLocalFileByteSize(uri);
  const principal = captureAuthenticatedPrincipal();
  if (!principal) {
    throw new StaleIdentityError('Not authenticated for media upload');
  }
  onProgress?.(0.05);
  const session = await mediaApi.createUploadSession(
    {
      purpose,
      mimeType,
      byteSize,
      fileName,
      width: prepared.width,
      height: prepared.height,
    },
    { principal },
  );
  onProgress?.(0.2);

  const upload = await FileSystem.uploadAsync(session.uploadUrl, uri, {
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

  if (!principalsEqual(principal, captureAuthenticatedPrincipal())) {
    throw new StaleIdentityError();
  }
  const completed = await mediaApi.completeUpload(session.mediaAssetId, {
    principal,
  });
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

/**
 * Truthful local file size for upload sessions.
 * Throws when size cannot be determined — never invents placeholder `1`.
 */
export async function requireLocalFileByteSize(uri: string): Promise<number> {
  const info = await FileSystem.getInfoAsync(uri);
  if (!info.exists || !('size' in info) || typeof info.size !== 'number') {
    throw new Error('Could not determine file size for upload');
  }
  if (!Number.isFinite(info.size) || info.size < 1 || !Number.isInteger(info.size)) {
    throw new Error('Invalid file size for upload');
  }
  return info.size;
}

async function fileSize(uri: string): Promise<number> {
  return requireLocalFileByteSize(uri);
}

function positivePixel(value: number | null | undefined): number | undefined {
  return typeof value === 'number' && value > 0 ? Math.round(value) : undefined;
}

function renamedFile(fileName: string, format: 'jpeg' | 'png' | 'webp'): string {
  const ext = format === 'jpeg' ? '.jpg' : format === 'png' ? '.png' : '.webp';
  const base = fileName.replace(/\.[a-zA-Z0-9]+$/, '') || 'upload';
  return `${base}${ext}`;
}

function readImageSize(
  uri: string,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    RNImage.getSize(
      uri,
      (width, height) => resolve({ width, height }),
      () => resolve(null),
    );
  });
}

/**
 * Scale a new photo down before upload. PDFs and other non-photos pass through.
 */
export async function prepareImageForUpload(
  input: LocalPickedFile & { purpose: MediaPurpose },
): Promise<LocalPickedFile> {
  let width = input.width;
  let height = input.height;
  const mime = input.mimeType.toLowerCase();
  if (
    (!width || !height) &&
    mime.startsWith('image/') &&
    mime !== 'image/gif'
  ) {
    const size = await readImageSize(input.uri);
    width = size?.width;
    height = size?.height;
  }
  const plan = planUploadResize({
    purpose: input.purpose,
    mimeType: input.mimeType,
    width,
    height,
  });
  if (!plan.resize) {
    return { ...input, width, height };
  }
  const format =
    plan.format === 'png'
      ? ImageManipulator.SaveFormat.PNG
      : plan.format === 'webp'
        ? ImageManipulator.SaveFormat.WEBP
        : ImageManipulator.SaveFormat.JPEG;
  const longest = (width ?? 0) >= (height ?? 0);
  const result = await ImageManipulator.manipulateAsync(
    input.uri,
    [longest ? { resize: { width: plan.maxEdge } } : { resize: { height: plan.maxEdge } }],
    { compress: UPLOAD_IMAGE_QUALITY, format },
  );
  const mimeType =
    plan.format === 'png'
      ? 'image/png'
      : plan.format === 'webp'
        ? 'image/webp'
        : 'image/jpeg';
  return {
    uri: result.uri,
    mimeType,
    byteSize: await requireLocalFileByteSize(result.uri),
    fileName: renamedFile(input.fileName, plan.format),
    width: result.width,
    height: result.height,
  };
}

function extensionForMime(mimeType: string): string {
  switch (mimeType) {
    case 'image/png':
      return '.png';
    case 'image/webp':
      return '.webp';
    case 'image/gif':
      return '.gif';
    case 'application/pdf':
      return '.pdf';
    default:
      return '.jpg';
  }
}
