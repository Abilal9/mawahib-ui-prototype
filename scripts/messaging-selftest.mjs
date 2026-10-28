/**
 * Messaging completion source contract.
 * Multi-photo cap, one-message attachments, and account-switch isolation.
 */
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const backend = join(root, '..', 'mawahib-backend');
const read = (path) => readFileSync(join(root, path), 'utf8');
const readBackend = (path) => readFileSync(join(backend, path), 'utf8');

const config = read('src/config/messaging.ts');
const picker = read('src/lib/uploadMedia.ts');
const chat = read('src/screens/messages/ChatScreen.tsx');
const inbox = read('src/screens/messages/MessagesInboxScreen.tsx');
const archived = read('src/screens/messages/ArchivedConversationsScreen.tsx');
const media = read('src/screens/messages/ConversationMediaScreen.tsx');
const unread = read('src/context/MessagingUnreadContext.tsx');
const connections = read('src/context/ConnectionsContext.tsx');
const service = read('src/services/messageService.ts');
const receipts = readBackend('src/modules/messaging/message-receipts.ts');
const dto = readBackend('src/modules/messaging/dto/messaging.dto.ts');
const messaging = readBackend('src/modules/messaging/messaging.service.ts');

assert.match(config, /MAX_MESSAGE_ATTACHMENTS = 10/);
assert.match(config, /MESSAGE_ATTACHMENT_MAX_BYTES = 20 \* 1024 \* 1024/);
assert.match(receipts, /MAX_MESSAGE_ATTACHMENTS = 10/);
assert.match(dto, /ArrayMaxSize\(MAX_MESSAGE_ATTACHMENTS\)/);
assert.match(messaging, /new Set\(dto\.mediaAssetIds/);
assert.match(messaging, /at most \$\{MAX_MESSAGE_ATTACHMENTS\}/);
assert.match(messaging, /if \(existing\) return existing/);
assert.match(messaging, /clientMessageId was already used/);
assert.match(messaging, /work-started:\$\{engagementId\}/);
assert.match(messaging, /findSystemMessageByEvent/);
assert.match(
  readBackend('src/modules/media/media.service.ts'),
  /getStoredObjectMeta/,
);
assert.match(
  readBackend('src/modules/media/media.service.ts'),
  /does not match the upload session/,
);

assert.match(picker, /allowsMultipleSelection: false/);
assert.match(picker, /export async function pickLocalImages/);
assert.match(picker, /allowsMultipleSelection: true/);
assert.match(picker, /selectionLimit/);
assert.match(chat, /pickLocalImages\(room\)/);
assert.doesNotMatch(chat, /pickLocalImage\(/);
assert.match(chat, /MAX_MESSAGE_ATTACHMENTS/);
assert.match(chat, /sendingRef/);
assert.match(chat, /clientMessageIdRef/);
assert.match(chat, /imageGrid/);
assert.match(chat, /useIdentityGeneration\(conversationId\)/);
assert.match(chat, /markRead\(conversationId\)/);

assert.match(inbox, /useIdentityGeneration\('inbox'\)/);
assert.match(inbox, /isStale\(/);
assert.match(inbox, /conversationPreview/);
assert.match(inbox, /RefreshControl/);
assert.match(inbox, /Could not load conversations/);
assert.match(archived, /useIdentityGeneration\('archived'\)/);
assert.match(archived, /conversationPreview/);
assert.match(media, /useIdentityGeneration\(conversationId\)/);
assert.match(media, /entry\.id === item\.id/);
assert.match(unread, /useIdentityGeneration\('unread'\)/);
assert.match(unread, /isStale\(/);
assert.match(service, /export function conversationPreview/);
assert.match(connections, /boundMe/);
assert.match(connections, /This account changed before the conversation opened/);

const pkg = read('package.json');
assert.match(pkg, /messaging-selftest\.mjs/);

console.log('messaging selftest ok');
