import { User } from '../data/types';
import {
  connectionsApi,
  type ConnectionUserSummary,
} from './connectionsApi';
import { messagingApi } from './messagingApi';

export function connectionPeerToUser(peer: ConnectionUserSummary): User {
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

/**
 * Connections domain — Nest API. Seed/mock helpers remain for visitor
 * graphs that are not yet backed by a public connections endpoint.
 */
export const connectionService = {
  peerToUser: connectionPeerToUser,

  async listMine() {
    return connectionsApi.listConnections();
  },

  async listRequests(direction: 'incoming' | 'outgoing' | 'all' = 'all') {
    return connectionsApi.listRequests(direction);
  },

  async requestConnect(toUserId: string, message?: string) {
    return connectionsApi.createRequest({ toUserId, message });
  },

  async accept(requestId: string) {
    return connectionsApi.accept(requestId);
  },

  async reject(requestId: string) {
    return connectionsApi.reject(requestId);
  },

  async cancel(requestId: string) {
    return connectionsApi.cancel(requestId);
  },

  async disconnect(peerUserId: string) {
    return connectionsApi.disconnect(peerUserId);
  },

  /** Ensures a connection conversation exists; returns its id. */
  async openConversation(peerUserId: string): Promise<string> {
    const result = await connectionsApi.openConversation(peerUserId);
    return result.conversationId;
  },

  /** Map peer userId → conversationId for connection chats. */
  async conversationIdsByPeer(): Promise<Record<string, string>> {
    const conversations = await messagingApi.listConversations('connection');
    const map: Record<string, string> = {};
    for (const c of conversations) {
      if (c.peer?.id) map[c.peer.id] = c.id;
    }
    return map;
  },

  /** Legacy mock visitor graph — unused for signed-in own connections. */
  getConnectionsForUser(_userId: string): User[] {
    return [];
  },
};
