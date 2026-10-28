/**
 * Polling intervals for Phase 4 messaging / notifications.
 * Websockets / push arrive later — keep these conservative.
 */
export const INBOX_POLL_MS = 20_000;
export const CHAT_POLL_MS = 4_000;
export const NOTIFICATIONS_POLL_MS = 20_000;

/** Max characters for a chat message body (enforced FE + BE). */
export const MESSAGE_BODY_MAX_LENGTH = 1000;

/**
 * Photos and documents on one message. Same cap as the backend send DTO
 * (`MAX_MESSAGE_ATTACHMENTS`). The native picker can return more; the composer
 * stops at this number.
 */
export const MAX_MESSAGE_ATTACHMENTS = 10;

/** Matches the `message` media purpose: 20 MB per file. */
export const MESSAGE_ATTACHMENT_MAX_BYTES = 20 * 1024 * 1024;

export const MESSAGE_IMAGE_MIME_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
] as const;

export const MESSAGE_DOCUMENT_MIME_TYPE = 'application/pdf';
