import { Notification } from '../data/types';
import { notifications } from '../data/mock/notifications';

export const notificationService = {
  async list(): Promise<Notification[]> {
    return notifications;
  },

  async markRead(id: string): Promise<void> {
    const item = notifications.find((n) => n.id === id);
    if (item) item.read = true;
  },
};
