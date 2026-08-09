import { Notification } from '../data/types';
import { repositories } from '../repositories';

const repo = repositories.notifications;

export const notificationService = {
  async list(): Promise<Notification[]> {
    return repo.list();
  },

  listSync(): Notification[] {
    return repo.list();
  },

  async markRead(id: string): Promise<void> {
    repo.markRead(id);
  },

  markAllRead(): void {
    repo.markAllRead();
  },

  unreadCount(): number {
    return repo.unreadCount();
  },

  clearActions(id: string): void {
    repo.clearActions(id);
  },

  clearRatingPrompt(id: string): void {
    repo.clearRatingPrompt(id);
  },

  remove(id: string): void {
    repo.remove(id);
  },
};
