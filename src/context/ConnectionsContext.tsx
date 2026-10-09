import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { Alert, AppState } from 'react-native';
import { User, ConnectionRelation } from '../data/types';
import { ApiError } from '../lib/apiClient';
import {
  connectionPeerToUser,
  connectionService,
} from '../services/connectionService';
import type { ApiConnectionRequest } from '../services/connectionsApi';
import { useAuth } from './AuthContext';
import { useNotifications } from './NotificationsContext';

const CONNECTIONS_STALE_MS = 30_000;

function isSocialConnectionNotification(apiType?: string): boolean {
  return apiType === 'connection_accepted' || apiType === 'connection_request';
}

export type { ConnectionRelation };

interface ConnectionsContextValue {
  connectedIds: string[];
  outgoingIds: string[];
  incomingIds: string[];
  connectedUsers: User[];
  incomingUsers: User[];
  loading: boolean;
  /** True while a connection mutation is in flight. */
  mutationBusy: boolean;
  refresh: () => Promise<void>;
  /** Reloads when the last successful fetch is older than maxAgeMs. */
  refreshIfStale: (maxAgeMs?: number) => Promise<void>;
  getRelation: (userId: string) => ConnectionRelation;
  isConnected: (userId: string) => boolean;
  requestConnect: (userId: string) => Promise<string | null>;
  cancelOutgoing: (userId: string) => void;
  /** Optional requestId from feed DTO when ConnectionsContext map is stale. */
  acceptRequest: (userId: string, requestIdOverride?: string | null) => void;
  denyRequest: (userId: string) => void;
  disconnect: (userId: string) => void;
  /** Conversation id for a connected peer (connection chat). */
  getConversationId: (userId: string) => string | undefined;
  /** Returns existing conversation id or creates one via API. */
  openOrCreateConversation: (peerUserId: string) => Promise<string>;
}

const ConnectionsContext = createContext<ConnectionsContextValue | undefined>(
  undefined,
);

function errMessage(e: unknown, fallback: string): string {
  if (e instanceof ApiError || e instanceof Error) return e.message;
  return fallback;
}

export function ConnectionsProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const { mappedUser, apiUser, isSignedIn } = useAuth();
  const { notifications, loading: notificationsLoading } = useNotifications();
  const me = mappedUser?.id || apiUser?.id || '';
  const epoch = useRef(0);
  const lastOk = useRef(0);
  const inflight = useRef<Promise<void> | null>(null);
  const inflightEpoch = useRef<number | null>(null);
  const acting = useRef<string | null>(null);
  const seenSocial = useRef<Set<string> | null>(null);

  const [connectedUsers, setConnectedUsers] = useState<User[]>([]);
  const [incomingUsers, setIncomingUsers] = useState<User[]>([]);
  const [outgoingIds, setOutgoingIds] = useState<string[]>([]);
  const [incomingRequestByUser, setIncomingRequestByUser] = useState<
    Record<string, string>
  >({});
  const [outgoingRequestByUser, setOutgoingRequestByUser] = useState<
    Record<string, string>
  >({});
  const [conversationByPeer, setConversationByPeer] = useState<
    Record<string, string>
  >({});
  const [loading, setLoading] = useState(false);
  const [mutationBusy, setMutationBusy] = useState(false);

  const connectedIds = useMemo(
    () => connectedUsers.map((u) => u.id),
    [connectedUsers],
  );
  const incomingIds = useMemo(
    () => incomingUsers.map((u) => u.id),
    [incomingUsers],
  );

  const refresh = useCallback(async () => {
    if (!isSignedIn || !me) {
      setConnectedUsers([]);
      setIncomingUsers([]);
      setOutgoingIds([]);
      setIncomingRequestByUser({});
      setOutgoingRequestByUser({});
      setConversationByPeer({});
      lastOk.current = Date.now();
      return;
    }

    const started = epoch.current;
    if (inflight.current && inflightEpoch.current === started) {
      return inflight.current;
    }

    const run = (async () => {
    setLoading(true);
    try {
      const [connections, requests, conversationMap] = await Promise.all([
        connectionService.listMine(),
        connectionService.listRequests('all'),
        connectionService.conversationIdsByPeer().catch(() => ({})),
      ]);
      if (started !== epoch.current) return;

      const pending = requests.filter((r) => r.status === 'pending');
      const incoming: ApiConnectionRequest[] = [];
      const outgoing: ApiConnectionRequest[] = [];
      const inMap: Record<string, string> = {};
      const outMap: Record<string, string> = {};

      for (const r of pending) {
        if (r.toUserId === me) {
          incoming.push(r);
          inMap[r.fromUserId] = r.id;
        } else if (r.fromUserId === me) {
          outgoing.push(r);
          outMap[r.toUserId] = r.id;
        }
      }

      const peers = connections.map((c) => {
        const user = connectionPeerToUser(c.peer);
        return user;
      });

      const convMap: Record<string, string> = { ...conversationMap };
      for (const c of connections) {
        if (c.conversationId) convMap[c.peer.id] = c.conversationId;
      }

      setConnectedUsers(peers);
      setIncomingUsers(incoming.map((r) => connectionPeerToUser(r.fromUser)));
      setOutgoingIds(outgoing.map((r) => r.toUserId));
      setIncomingRequestByUser(inMap);
      setOutgoingRequestByUser(outMap);
      setConversationByPeer(convMap);
      lastOk.current = Date.now();
    } catch (e) {
      console.warn('[connections] refresh failed', e);
    } finally {
      setLoading(false);
    }
    })();

    inflight.current = run;
    inflightEpoch.current = started;
    try {
      await run;
    } finally {
      if (inflight.current === run) inflight.current = null;
    }
  }, [isSignedIn, me]);

  const refreshIfStale = useCallback(
    async (maxAgeMs = CONNECTIONS_STALE_MS) => {
      if (Date.now() - lastOk.current < maxAgeMs) return;
      await refresh();
    },
    [refresh],
  );

  useEffect(() => {
    void refresh();
  }, [refresh]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (next) => {
      if (next === 'active') void refreshIfStale(CONNECTIONS_STALE_MS);
    });
    return () => sub.remove();
  }, [refreshIfStale]);

  useEffect(() => {
    if (notificationsLoading && seenSocial.current == null) return;
    const socialIds = notifications
      .filter((item) => isSocialConnectionNotification(item.apiType))
      .map((item) => item.id);
    if (seenSocial.current == null) {
      seenSocial.current = new Set(socialIds);
      return;
    }
    const unseen = socialIds.filter((id) => !seenSocial.current!.has(id));
    for (const id of socialIds) seenSocial.current.add(id);
    if (unseen.length > 0) void refresh();
  }, [notifications, notificationsLoading, refresh]);

  const value = useMemo<ConnectionsContextValue>(() => {
    const getRelation = (userId: string): ConnectionRelation => {
      if (me && userId === me) return 'connected';
      if (connectedIds.includes(userId)) return 'connected';
      if (outgoingIds.includes(userId)) return 'outgoing';
      if (incomingIds.includes(userId)) return 'incoming';
      return 'none';
    };

    return {
      connectedIds,
      outgoingIds,
      incomingIds,
      connectedUsers,
      incomingUsers,
      loading,
      mutationBusy,
      refresh,
      refreshIfStale,
      getRelation,
      isConnected: (userId) => getRelation(userId) === 'connected',
      requestConnect: async (userId) => {
        if (!me || userId === me) return null;
        if (acting.current) return null;
        if (getRelation(userId) !== 'none') return null;
        acting.current = userId;
        setMutationBusy(true);
        epoch.current += 1;
        setOutgoingIds((prev) =>
          prev.includes(userId) ? prev : [...prev, userId],
        );
        try {
          const created = await connectionService.requestConnect(userId);
          setOutgoingRequestByUser((prev) => ({
            ...prev,
            [userId]: created.id,
          }));
          return created.id;
        } catch (e) {
          setOutgoingIds((prev) => prev.filter((id) => id !== userId));
          Alert.alert(
            'Could not send request',
            errMessage(e, 'Please try again.'),
          );
          return null;
        } finally {
          acting.current = null;
          setMutationBusy(false);
        }
      },
      cancelOutgoing: (userId) => {
        if (acting.current) return;
        const requestId = outgoingRequestByUser[userId];
        if (!requestId) {
          setOutgoingIds((prev) => prev.filter((id) => id !== userId));
          setOutgoingRequestByUser((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
          return;
        }
        epoch.current += 1;
        const mutationEpoch = epoch.current;
        setOutgoingIds((prev) => prev.filter((id) => id !== userId));
        setOutgoingRequestByUser((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        void (async () => {
          try {
            await connectionService.cancel(requestId);
            // A refresh that started after this bump may have read the
            // request before the cancel landed. Discard it and reload once.
            if (
              epoch.current === mutationEpoch &&
              inflightEpoch.current === mutationEpoch
            ) {
              epoch.current += 1;
              await refresh();
            }
          } catch (e) {
            Alert.alert(
              'Could not cancel request',
              errMessage(e, 'Please try again.'),
            );
            if (epoch.current === mutationEpoch) {
              epoch.current += 1;
              await refresh();
            }
          }
        })();
      },
      acceptRequest: (userId, requestIdOverride) => {
        if (acting.current) return;
        const requestId =
          requestIdOverride?.trim() || incomingRequestByUser[userId];
        acting.current = userId;
        setMutationBusy(true);
        epoch.current += 1;
        const incomingUser = incomingUsers.find((u) => u.id === userId);
        setIncomingUsers((prev) => prev.filter((u) => u.id !== userId));
        setIncomingRequestByUser((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        if (incomingUser) {
          setConnectedUsers((prev) =>
            prev.some((u) => u.id === userId) ? prev : [...prev, incomingUser],
          );
        }
        void (async () => {
          try {
            if (!requestId) {
              await refresh();
              return;
            }
            const connection = await connectionService.accept(requestId);
            if (connection.conversationId) {
              setConversationByPeer((prev) => ({
                ...prev,
                [userId]: connection.conversationId!,
              }));
            }
            const peer = connectionPeerToUser(connection.peer);
            setConnectedUsers((prev) =>
              prev.some((u) => u.id === peer.id) ? prev : [...prev, peer],
            );
            epoch.current += 1;
            await refresh();
          } catch (e) {
            Alert.alert(
              'Could not accept request',
              errMessage(e, 'Please try again.'),
            );
            epoch.current += 1;
            await refresh();
          } finally {
            acting.current = null;
            setMutationBusy(false);
          }
        })();
      },
      denyRequest: (userId) => {
        if (acting.current) return;
        const requestId = incomingRequestByUser[userId];
        if (!requestId) {
          setIncomingUsers((prev) => prev.filter((u) => u.id !== userId));
          setIncomingRequestByUser((prev) => {
            const next = { ...prev };
            delete next[userId];
            return next;
          });
          return;
        }
        epoch.current += 1;
        const mutationEpoch = epoch.current;
        setIncomingUsers((prev) => prev.filter((u) => u.id !== userId));
        setIncomingRequestByUser((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        void (async () => {
          try {
            await connectionService.reject(requestId);
            if (
              epoch.current === mutationEpoch &&
              inflightEpoch.current === mutationEpoch
            ) {
              epoch.current += 1;
              await refresh();
            }
          } catch (e) {
            Alert.alert(
              'Could not deny request',
              errMessage(e, 'Please try again.'),
            );
            if (epoch.current === mutationEpoch) {
              epoch.current += 1;
              await refresh();
            }
          }
        })();
      },
      disconnect: (userId) => {
        if (acting.current) return;
        acting.current = userId;
        setMutationBusy(true);
        epoch.current += 1;
        setConnectedUsers((prev) => prev.filter((u) => u.id !== userId));
        setConversationByPeer((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        void (async () => {
          try {
            await connectionService.disconnect(userId);
            epoch.current += 1;
            await refresh();
          } catch (e) {
            Alert.alert(
              'Could not disconnect',
              errMessage(e, 'Please try again.'),
            );
            epoch.current += 1;
            await refresh();
          } finally {
            acting.current = null;
            setMutationBusy(false);
          }
        })();
      },
      getConversationId: (userId) => conversationByPeer[userId],
      openOrCreateConversation: async (peerUserId) => {
        const existing = conversationByPeer[peerUserId];
        if (existing) return existing;
        const conversationId =
          await connectionService.openConversation(peerUserId);
        setConversationByPeer((prev) => ({
          ...prev,
          [peerUserId]: conversationId,
        }));
        return conversationId;
      },
    };
  }, [
    me,
    connectedIds,
    outgoingIds,
    incomingIds,
    connectedUsers,
    incomingUsers,
    loading,
    mutationBusy,
    refresh,
    refreshIfStale,
    incomingRequestByUser,
    outgoingRequestByUser,
    conversationByPeer,
  ]);

  return (
    <ConnectionsContext.Provider value={value}>
      {children}
    </ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) {
    throw new Error('useConnections must be used within ConnectionsProvider');
  }
  return ctx;
}
