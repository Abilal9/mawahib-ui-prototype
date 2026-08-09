import { getConnectionsForUser } from '../../data/mock/connections';
import { conversations } from '../../data/mock/messages';
import { users, currentUser } from '../../data/mock/users';
import { ConnectionRepository } from '../types';

/** Connection seeds — live relation state lives in ConnectionsContext. */
export const mockConnectionRepository: ConnectionRepository = {
  getSeedConnectedIds: () => conversations.slice(0, 2).map((c) => c.participant.id),
  getSeedIncomingIds: (selfId, connectedIds) =>
    users
      .filter((u) => u.id !== selfId && !connectedIds.includes(u.id))
      .slice(0, 3)
      .map((u) => u.id),
  getConnectionsForUser: (userId) => getConnectionsForUser(userId),
  getConversationId: (userId) =>
    conversations.find((c) => c.participant.id === userId)?.id,
};

/** Convenience for seed self-id */
export const MOCK_SELF_ID = currentUser.id;
