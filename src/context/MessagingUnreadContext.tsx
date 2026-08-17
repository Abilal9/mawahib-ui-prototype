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
import { usePolling } from '../hooks/usePolling';
import { messageService } from '../services/messageService';
import { useAuth } from './AuthContext';

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
 * Count comes from Nest (`/users/me/conversations/unread-summary`), so it
 * survives restarts and stays aligned with server read markers.
 */
export function MessagingUnreadProvider({ children }: { children: ReactNode }) {
  const { isSignedIn } = useAuth();
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
      setUnreadCount(0);
      return;
    }
    setLoading(true);
    try {
      const summary = await messageService.unreadSummary();
      setUnreadCount(summary.unreadCount);
    } catch (e) {
      console.warn('[messaging-unread] refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  usePolling(refresh, INBOX_POLL_MS, isSignedIn && appActive);

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
