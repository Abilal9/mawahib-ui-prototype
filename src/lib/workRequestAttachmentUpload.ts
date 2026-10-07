import { Alert } from 'react-native';
import { ApiError } from './apiClient';
import {
  type LocalPickedFile,
  pickLocalDocument,
  pickLocalImage,
  uploadLocalFile,
} from './uploadMedia';
import {
  ApiWorkRequestAttachment,
  marketplaceApi,
} from '../services/marketplaceApi';
import { validateWorkRequestAttachment } from '../utils/workRequestAttachments';

export type AttachmentPickKind = 'document' | 'image';

/**
 * Picks a local file for a work request without uploading it yet (the request
 * may not exist). Returns a validation error instead of a file when the pick
 * is unusable (wrong type / too large).
 */
export async function pickWorkRequestFile(
  kind: AttachmentPickKind,
): Promise<{ file: LocalPickedFile } | { error: string } | null> {
  const file =
    kind === 'document' ? await pickLocalDocument() : await pickLocalImage();
  if (!file) return null;
  const problem = validateWorkRequestAttachment(file);
  if (problem) return { error: problem };
  return { file };
}

/** Upload one file (purpose `work_request`) and register it on the request. */
export async function uploadAndAttachFile(
  workRequestId: string,
  file: LocalPickedFile,
  onProgress?: (ratio: number) => void,
): Promise<ApiWorkRequestAttachment> {
  const uploaded = await uploadLocalFile({
    ...file,
    purpose: 'work_request',
    onProgress,
  });
  return marketplaceApi.addWorkRequestAttachment(workRequestId, {
    mediaAssetId: uploaded.mediaAssetId,
    originalFileName: file.fileName,
  });
}

export interface AttachFilesResult {
  attached: ApiWorkRequestAttachment[];
  failed: { fileName: string; message: string }[];
}

/**
 * Create-then-attach: used right after a work request is created (the create
 * API takes no attachments). Never throws — a failed file is reported so the
 * already-created request is not lost.
 */
export async function attachFilesToWorkRequest(
  workRequestId: string,
  files: LocalPickedFile[],
): Promise<AttachFilesResult> {
  const result: AttachFilesResult = { attached: [], failed: [] };
  for (const file of files) {
    try {
      result.attached.push(await uploadAndAttachFile(workRequestId, file));
    } catch (e) {
      result.failed.push({
        fileName: file.fileName,
        message:
          e instanceof ApiError || e instanceof Error
            ? e.message
            : 'Upload failed',
      });
    }
  }
  return result;
}

/** Alert copy for a partial failure after the request itself was created. */
export function attachmentFailureMessage(failed: AttachFilesResult['failed']): string {
  const names = failed.map((f) => f.fileName).join(', ');
  return `Your request was sent, but ${failed.length === 1 ? 'this file' : 'these files'} could not be attached: ${names}. You can add ${failed.length === 1 ? 'it' : 'them'} from the request.`;
}

/** Asks Document vs Photo, then picks + validates. Resolves null on cancel. */
export function promptPickWorkRequestFile(): Promise<
  { file: LocalPickedFile } | { error: string } | null
> {
  return new Promise((resolve) => {
    const run = (kind: AttachmentPickKind) => {
      pickWorkRequestFile(kind)
        .then(resolve)
        .catch((e: unknown) =>
          resolve({
            error: e instanceof Error ? e.message : 'Could not pick that file',
          }),
        );
    };
    Alert.alert(
      'Attach a file',
      'PDF, JPG or PNG · up to 20 MB',
      [
        { text: 'Document (PDF)', onPress: () => run('document') },
        { text: 'Photo', onPress: () => run('image') },
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}
