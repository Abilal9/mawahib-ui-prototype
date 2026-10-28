import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { Notification } from '../data/types';
import { NOTIFICATIONS_POLL_MS } from '../config/messaging';
import { usePolling } from '../hooks/usePolling';
import { notificationService } from '../services';
import { useAuth } from './AuthContext';
import { shouldIgnoreStaleIdentityResult } from './identityGuard';
import { accessTokenSubject } from '../lib/apiClient';

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
  const { apiUser, isSignedIn, accessToken } = useAuth();
  const userId = apiUser?.id ?? null;
  const userIdRef = useRef(userId);
  const accessTokenRef = useRef(accessToken);
  const epochRef = useRef(0);
  const boundUser = useRef(userId);
  accessTokenRef.current = accessToken;
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active',
  );

  // Drop the previous account's inbox in this render. The list endpoint
  // returns one page with no cursor, so list + unread count are one refresh.
  userIdRef.current = userId;
  let shownNotifications = notifications;
  let shownUnread = unreadCount;
  let shownLoading = loading;
  if (boundUser.current !== userId) {
    boundUser.current = userId;
    epochRef.current += 1;
    shownNotifications = [];
    shownUnread = 0;
    shownLoading = false;
    setNotifications([]);
    setUnreadCount(0);
    setLoading(false);
  }

  const stale = (startedUserId: string | null, epochAtStart: number) =>
    shouldIgnoreStaleIdentityResult({
      startedUserId,
      currentUserId: userIdRef.current,
      epochAtStart,
      epochNow: epochRef.current,
    });

  const tokenFor = (startedUserId: string | null) => {
    const token = accessTokenRef.current;
    if (!startedUserId || !token) return null;
    if (accessTokenSubject(token) !== startedUserId) return null;
    return token;
  };

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      setAppActive(next === 'active');
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const refresh = useCallback(async () => {
    const startedUserId = userIdRef.current;
    const epochAtStart = epochRef.current;
    const token = tokenFor(startedUserId);
    if (!startedUserId || !token) {
      setNotifications([]);
      setUnreadCount(0);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [items, count] = await Promise.all([
        notificationService.list(token),
        notificationService.unreadCount(token),
      ]);
      if (
        shouldIgnoreStaleIdentityResult({
          startedUserId,
          currentUserId: userIdRef.current,
          epochAtStart,
          epochNow: epochRef.current,
        })
      ) {
        return;
      }
      setNotifications(items);
      setUnreadCount(count);
    } catch (e) {
      console.warn('[notifications] refresh failed', e);
    } finally {
      if (
        !shouldIgnoreStaleIdentityResult({
          startedUserId,
          currentUserId: userIdRef.current,
          epochAtStart,
          epochNow: epochRef.current,
        })
      ) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [userId, refresh]);

  usePolling(refresh, NOTIFICATIONS_POLL_MS, isSignedIn && appActive);

  const value = useMemo<NotificationsContextValue>(
    () => ({
      notifications: shownNotifications,
      unreadCount: shownUnread,
      loading: shownLoading,
      markRead: (id) => {
        const startedUserId = userIdRef.current;
        const epochAtStart = epochRef.current;
        const token = tokenFor(startedUserId);
        if (stale(startedUserId, epochAtStart) || !token) return;
        setNotifications((prev) => {
          if (stale(startedUserId, epochAtStart)) return prev;
          return prev.map((n) => (n.id === id ? { ...n, read: true } : n));
        });
        setUnreadCount((c) => {
          if (stale(startedUserId, epochAtStart)) return c;
          return Math.max(0, c - 1);
        });
        void notificationService.markRead(id, token).catch(() => {
          if (stale(startedUserId, epochAtStart)) return;
          void refresh();
        });
      },
      markAllRead: () => {
        const startedUserId = userIdRef.current;
        const epochAtStart = epochRef.current;
        const token = tokenFor(startedUserId);
        if (stale(startedUserId, epochAtStart) || !token) return;
        setNotifications((prev) => {
          if (stale(startedUserId, epochAtStart)) return prev;
          return prev.map((n) => ({ ...n, read: true }));
        });
        setUnreadCount((c) => {
          if (stale(startedUserId, epochAtStart)) return c;
          return 0;
        });
        void notificationService.markAllRead(token).catch(() => {
          if (stale(startedUserId, epochAtStart)) return;
          void refresh();
        });
      },
      clearActions: (id) => {
        const startedUserId = userIdRef.current;
        const epochAtStart = epochRef.current;
        setNotifications((prev) => {
          if (stale(startedUserId, epochAtStart)) return prev;
          return prev.map((n) =>
            n.id === id ? { ...n, actions: undefined } : n,
          );
        });
      },
      clearRatingPrompt: (id) => {
        const startedUserId = userIdRef.current;
        const epochAtStart = epochRef.current;
        setNotifications((prev) => {
          if (stale(startedUserId, epochAtStart)) return prev;
          return prev.map((n) =>
            n.id === id ? { ...n, showRating: false } : n,
          );
        });
      },
      remove: (id) => {
        const startedUserId = userIdRef.current;
        const epochAtStart = epochRef.current;
        setNotifications((prev) => {
          if (stale(startedUserId, epochAtStart)) return prev;
          const target = prev.find((n) => n.id === id);
          if (target && !target.read) {
            setUnreadCount((c) => {
              if (stale(startedUserId, epochAtStart)) return c;
              return Math.max(0, c - 1);
            });
          }
          return prev.filter((n) => n.id !== id);
        });
      },
      refresh,
    }),
    [shownNotifications, shownUnread, shownLoading, refresh],
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
