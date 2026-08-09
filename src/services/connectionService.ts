import { User } from '../data/types';
import { repositories } from '../repositories';

const repo = repositories.connections;

export const connectionService = {
  getSeedConnectedIds(): string[] {
    return repo.getSeedConnectedIds();
  },

  getSeedIncomingIds(selfId: string, connectedIds: string[]): string[] {
    return repo.getSeedIncomingIds(selfId, connectedIds);
  },

  getConnectionsForUser(userId: string): User[] {
    return repo.getConnectionsForUser(userId);
  },

  getConversationId(userId: string): string | undefined {
    return repo.getConversationId(userId);
  },
};
