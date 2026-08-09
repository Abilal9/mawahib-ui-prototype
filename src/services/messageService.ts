import { Conversation, Message } from '../data/types';
import { repositories } from '../repositories';

const repo = repositories.messages;

export const messageService = {
  async listConversations(): Promise<Conversation[]> {
    return repo.listConversations();
  },

  listConversationsSync(): Conversation[] {
    return repo.listConversations();
  },

  getConversationById(id: string): Conversation | undefined {
    return repo.getConversationById(id);
  },

  async getMessages(conversationId: string): Promise<Message[]> {
    return repo.getMessages(conversationId);
  },

  getMessagesSync(conversationId: string): Message[] {
    return repo.getMessages(conversationId);
  },
};
