import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Notification } from '../data/types';
import { NOTIFICATIONS_POLL_MS } from '../config/messaging';
import { usePolling } from '../hooks/usePolling';
import { notificationService } from '../services';
import { useAuth } from './AuthContext';

interface NotificationsContextValue {
  notifications: Notification[];
  unreadCount: number;
  loading: boolean;
  markRead: (id: string) => void;
  markAllRead: () => void;
  /** Local-only: strip inline accept/decline (legacy mock UX). */
  clearActions: (id: string) => void;
  /** Local-only: hide rating prompt (legacy mock UX). */
  clearRatingPrompt: (id: string) => void;
  /** Local-only remove until next refresh. */
  remove: (id: string) => void;
  refresh: () => Promise<void>;
}

const NotificationsContext = createContext<
  NotificationsContextValue | undefined
>(undefined);

export function NotificationsProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active',
  );

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      setAppActive(next === 'active');
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const refresh = useCallback(async () => {
    if (!isSignedIn) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const [items, count] = await Promise.all([
        notificationService.list(),
        notificationService.unreadCount(),
      ]);
      setNotifications(items);
      setUnreadCount(count);
    } catch (e) {
      console.warn('[notifications] refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  usePolling(refresh, NOTIFICATIONS_POLL_MS, isSignedIn && appActive);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications,
      unreadCount,
      loading,
      markRead: (id) => {
        setNotifications((prev) =>
          prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
        );
        setUnreadCount((c) => Math.max(0, c - 1));
        void notificationService.markRead(id).catch(() => {
          void refresh();
        });
      },
      markAllRead: () => {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        setUnreadCount(0);
        void notificationService.markAllRead().catch(() => {
          void refresh();
        });
      },
      clearActions: (id) => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, actions: undefined } : n,
          ),
        );
      },
      clearRatingPrompt: (id) => {
        setNotifications((prev) =>
          prev.map((n) =>
            n.id === id ? { ...n, showRating: false } : n,
          ),
        );
      },
      remove: (id) => {
        setNotifications((prev) => {
          const target = prev.find((n) => n.id === id);
          if (target && !target.read) {
            setUnreadCount((c) => Math.max(0, c - 1));
          }
          return prev.filter((n) => n.id !== id);
        });
      },
      refresh,
    }),
    [notifications, unreadCount, loading, refresh],
  );

  return (
    <NotificationsContext.Provider value={value}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) {
    throw new Error(
      'useNotifications must be used within NotificationsProvider',
    );
  }
  return ctx;
}
