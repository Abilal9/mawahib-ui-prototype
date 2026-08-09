import {
  conversations,
  getMessagesByConversation,
  getConversationById,
} from '../../data/mock/messages';
import { MessageRepository } from '../types';

/** Messages/conversations — mock; swap for realtime later. */
export const mockMessageRepository: MessageRepository = {
  listConversations: () => conversations,
  getConversationById: (id) => getConversationById(id),
  getMessages: (conversationId) => getMessagesByConversation(conversationId),
};
