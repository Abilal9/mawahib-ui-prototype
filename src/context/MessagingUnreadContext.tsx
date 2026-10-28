import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import { AppState, type AppStateStatus } from 'react-native';
import { INBOX_POLL_MS } from '../config/messaging';
import { useIdentityGeneration } from '../hooks/useIdentityGeneration';
import { usePolling } from '../hooks/usePolling';
import { messageService } from '../services/messageService';

interface MessagingUnreadContextValue {
  unreadCount: number;
  loading: boolean;
  refresh: () => Promise<void>;
}

const MessagingUnreadContext = createContext<
  MessagingUnreadContextValue | undefined
>(undefined);

/**
 * App-wide messaging unread badge source.
 * Nest `/users/me/conversations/unread-summary` returns the number of
 * inbox conversations with unread messages (not total unread messages).
 * A late response from the previous account is dropped.
 */
export function MessagingUnreadProvider({ children }: { children: ReactNode }) {
  const { userId, isSignedIn, identityChanged, snapshot, isStale } =
    useIdentityGeneration('unread');
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [appActive, setAppActive] = useState(
    AppState.currentState === 'active',
  );

  if (identityChanged) {
    setUnreadCount(0);
    setLoading(false);
  }

  useEffect(() => {
    const onChange = (next: AppStateStatus) => {
      setAppActive(next === 'active');
    };
    const sub = AppState.addEventListener('change', onChange);
    return () => sub.remove();
  }, []);

  const refresh = useCallback(async () => {
    const started = snapshot();
    if (!started.userId || isStale(started.userId, started.epoch)) {
      if (!isStale(started.userId, started.epoch)) {
        setUnreadCount(0);
        setLoading(false);
      }
      return;
    }
    setLoading(true);
    try {
      const summary = await messageService.unreadSummary();
      if (isStale(started.userId, started.epoch)) return;
      setUnreadCount(summary.unreadCount);
    } catch (e) {
      console.warn('[messaging-unread] refresh failed', e);
    } finally {
      if (!isStale(started.userId, started.epoch)) setLoading(false);
    }
  }, [isStale, snapshot]);

  useEffect(() => {
    void refresh();
  }, [userId, refresh]);

  usePolling(refresh, INBOX_POLL_MS, isSignedIn && Boolean(userId) && appActive);

  const value = useMemo(
    () => ({ unreadCount, loading, refresh }),
    [unreadCount, loading, refresh],
  );

  return (
    <MessagingUnreadContext.Provider value={value}>
      {children}
    </MessagingUnreadContext.Provider>
  );
}

export function useMessagingUnread(): MessagingUnreadContextValue {
  const ctx = useContext(MessagingUnreadContext);
  if (!ctx) {
    throw new Error(
      'useMessagingUnread must be used within MessagingUnreadProvider',
    );
  }
  return ctx;
}
