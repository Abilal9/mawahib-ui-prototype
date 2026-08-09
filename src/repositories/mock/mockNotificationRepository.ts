import { Notification } from '../../data/types';
import { notifications as seed } from '../../data/mock/notifications';
import { NotificationRepository } from '../types';

/** Shared notification store so Home badge and Clear All stay in sync. */
let items: Notification[] = seed.map((n) => ({ ...n }));

export const mockNotificationRepository: NotificationRepository = {
  list: () => items,
  markRead: (id) => {
    items = items.map((n) => (n.id === id ? { ...n, read: true } : n));
  },
  markAllRead: () => {
    items = items.map((n) => ({ ...n, read: true }));
  },
  unreadCount: () => items.filter((n) => !n.read).length,
  clearActions: (id) => {
    items = items.map((n) =>
      n.id === id ? { ...n, read: true, actions: undefined } : n
    );
  },
  clearRatingPrompt: (id) => {
    items = items.map((n) =>
      n.id === id ? { ...n, read: true, showRating: false } : n
    );
  },
  remove: (id) => {
    items = items.filter((n) => n.id !== id);
  },
};

export function resetMockNotifications() {
  items = seed.map((n) => ({ ...n }));
}
