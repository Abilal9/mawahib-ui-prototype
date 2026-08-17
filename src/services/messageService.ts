import { User } from '../data/types';
import {
  messagingApi,
  type ApiConversation,
  type ApiMessage,
  type ConversationListScope,
  type PeerSummary,
} from './messagingApi';

function peerToUser(peer: PeerSummary | null | undefined): User {
  if (!peer) {
    return {
      id: '',
      name: 'Unknown',
      username: 'unknown',
      avatar: '',
      followers: 0,
      following: 0,
      posts: 0,
    };
  }
  return {
    id: peer.id,
    name: peer.displayName,
    username: peer.username,
    avatar: peer.avatarUrl ?? '',
    isVerified: peer.isVerified,
    title: peer.title ?? undefined,
    followers: 0,
    following: 0,
    posts: 0,
  };
}

export function isConversationUnread(c: ApiConversation): boolean {
  if (!c.lastMessageAt) return false;
  if (!c.lastReadAt) return true;
  return new Date(c.lastMessageAt).getTime() > new Date(c.lastReadAt).getTime();
}

export const messageService = {
  listConversations(
    type?: 'connection' | 'work',
    scope: ConversationListScope = 'inbox',
  ): Promise<ApiConversation[]> {
    return messagingApi.listConversations(type, scope);
  },

  getConversation(id: string): Promise<ApiConversation> {
    return messagingApi.getConversation(id);
  },

  async getMessages(
    conversationId: string,
    params?: { cursor?: string; limit?: number },
  ): Promise<{ items: ApiMessage[]; nextCursor: string | null }> {
    return messagingApi.listMessages(conversationId, params);
  },

  sendMessage(
    conversationId: string,
    input: {
      body?: string;
      mediaAssetIds?: string[];
      clientMessageId?: string;
    },
  ): Promise<ApiMessage> {
    return messagingApi.sendMessage(conversationId, input);
  },

  markRead(conversationId: string): Promise<ApiConversation> {
    return messagingApi.markRead(conversationId);
  },

  archive(conversationId: string): Promise<ApiConversation> {
    return messagingApi.archive(conversationId);
  },

  unarchive(conversationId: string): Promise<ApiConversation> {
    return messagingApi.unarchive(conversationId);
  },

  softDelete(conversationId: string): Promise<void> {
    return messagingApi.softDelete(conversationId);
  },

  unreadSummary(): Promise<{ unreadCount: number }> {
    return messagingApi.unreadSummary();
  },

  peerToUser,

  findWorkConversation(
    conversations: ApiConversation[],
    engagementId: string,
  ): ApiConversation | undefined {
    return conversations.find(
      (c) =>
        c.type === 'work' &&
        (c.workEngagementId === engagementId ||
          c.workContext?.engagementId === engagementId),
    );
  },
};
