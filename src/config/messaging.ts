/**
 * Polling intervals for Phase 4 messaging / notifications.
 * Websockets / push arrive later — keep these conservative.
 */
export const INBOX_POLL_MS = 20_000;
export const CHAT_POLL_MS = 4_000;
export const NOTIFICATIONS_POLL_MS = 20_000;

/** Max characters for a chat message body (enforced FE + BE). */
export const MESSAGE_BODY_MAX_LENGTH = 1000;
