import { Conversation, Message } from '../data/types';
import { conversations, getMessagesByConversation } from '../data/mock/messages';

export const messageService = {
  async listConversations(): Promise<Conversation[]> {
    return conversations;
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    return getMessagesByConversation(conversationId);
  },
};
