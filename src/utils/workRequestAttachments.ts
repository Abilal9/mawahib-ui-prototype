/**
 * Work-request attachment helpers. Real files live in storage and are listed by
 * `GET /work-requests/:id/attachments` — attachments are NEVER serialised into
 * the notes / message text. Dependency-free (selftest imports it directly).
 */

/** Mirrors the backend `work_request` media purpose. */
export const WORK_REQUEST_ATTACHMENT_MIME_TYPES: readonly string[] = [
  'image/jpeg',
  'image/png',
  'application/pdf',
];
export const WORK_REQUEST_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;
export const WORK_REQUEST_ATTACHMENT_MAX_COUNT = 10;

export interface AttachmentCandidate {
  mimeType: string;
  byteSize: number;
  fileName: string;
}

/** Returns a user-facing problem with the file, or null when it can be uploaded. */
export function validateWorkRequestAttachment(
  file: AttachmentCandidate,
): string | null {
  const mime = file.mimeType.trim().toLowerCase();
  if (!WORK_REQUEST_ATTACHMENT_MIME_TYPES.includes(mime)) {
    return `${file.fileName}: only PDF, JPG and PNG files can be attached.`;
  }
  if (!(file.byteSize > 0)) {
    return `${file.fileName}: the file is empty.`;
  }
  if (file.byteSize > WORK_REQUEST_ATTACHMENT_MAX_BYTES) {
    return `${file.fileName}: files must be 20 MB or smaller.`;
  }
  return null;
}

export function attachmentIcon(
  nameOrMime: string,
): 'document-text-outline' | 'image-outline' | 'archive-outline' | 'document-outline' {
  const lower = nameOrMime.toLowerCase();
  if (lower.startsWith('image/') || /\.(png|jpe?g|gif|webp|heic)$/.test(lower)) {
    return 'image-outline';
  }
  if (/\.(zip|rar|7z)$/.test(lower)) return 'archive-outline';
  if (
    lower === 'application/pdf' ||
    /\.(pdf|docx?|xlsx?|pptx?|txt)$/.test(lower)
  ) {
    return 'document-text-outline';
  }
  return 'document-outline';
}
