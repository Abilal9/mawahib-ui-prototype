import React, { createContext, useContext, useMemo, useState, ReactNode } from 'react';
import { Notification } from '../data/types';
import { notificationService } from '../services';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  markRead: (id: string) => void;
  markAllRead: () => void;
  clearActions: (id: string) => void;
  clearRatingPrompt: (id: string) => void;
  remove: (id: string) => void;
  refresh: () => void;
}

const NotificationsContext = createContext<NotificationsContextValue | undefined>(
  undefined
);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const [version, setVersion] = useState(0);
  const refresh = () => setVersion((v) => v + 1);

  const value = useMemo<NotificationsContextValue>(() => {
    void version;
    return {
      notifications: notificationService.listSync(),
      unreadCount: notificationService.unreadCount(),
      markRead: (id) => {
        void notificationService.markRead(id);
        refresh();
      },
      markAllRead: () => {
        notificationService.markAllRead();
        refresh();
      },
      clearActions: (id) => {
        notificationService.clearActions(id);
        refresh();
      },
      clearRatingPrompt: (id) => {
        notificationService.clearRatingPrompt(id);
        refresh();
      },
      remove: (id) => {
        notificationService.remove(id);
        refresh();
      },
      refresh,
    };
  }, [version]);

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
