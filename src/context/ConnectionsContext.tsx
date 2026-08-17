import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { Alert } from 'react-native';
import { User, ConnectionRelation } from '../data/types';
import { ApiError } from '../lib/apiClient';
import {
  connectionPeerToUser,
  connectionService,
} from '../services/connectionService';
import type { ApiConnectionRequest } from '../services/connectionsApi';
import { useAuth } from './AuthContext';

export type { ConnectionRelation };

interface ConnectionsContextValue {
  connectedIds: string[];
  outgoingIds: string[];
  incomingIds: string[];
  connectedUsers: User[];
  incomingUsers: User[];
  loading: boolean;
  refresh: () => Promise<void>;
  getRelation: (userId: string) => ConnectionRelation;
  isConnected: (userId: string) => boolean;
  requestConnect: (userId: string) => void;
  cancelOutgoing: (userId: string) => void;
  acceptRequest: (userId: string) => void;
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
  const me = mappedUser?.id || apiUser?.id || '';

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
      return;
    }

    setLoading(true);
    try {
      const [connections, requests, conversationMap] = await Promise.all([
        connectionService.listMine(),
        connectionService.listRequests('all'),
        connectionService.conversationIdsByPeer().catch(() => ({})),
      ]);

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
    } catch (e) {
      console.warn('[connections] refresh failed', e);
    } finally {
      setLoading(false);
    }
  }, [isSignedIn, me]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

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
      refresh,
      getRelation,
      isConnected: (userId) => getRelation(userId) === 'connected',
      requestConnect: (userId) => {
        if (!me || userId === me) return;
        if (getRelation(userId) !== 'none') return;
        setOutgoingIds((prev) =>
          prev.includes(userId) ? prev : [...prev, userId],
        );
        void (async () => {
          try {
            const created = await connectionService.requestConnect(userId);
            setOutgoingRequestByUser((prev) => ({
              ...prev,
              [userId]: created.id,
            }));
          } catch (e) {
            setOutgoingIds((prev) => prev.filter((id) => id !== userId));
            Alert.alert(
              'Could not send request',
              errMessage(e, 'Please try again.'),
            );
          }
        })();
      },
      cancelOutgoing: (userId) => {
        const requestId = outgoingRequestByUser[userId];
        setOutgoingIds((prev) => prev.filter((id) => id !== userId));
        setOutgoingRequestByUser((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        if (!requestId) return;
        void (async () => {
          try {
            await connectionService.cancel(requestId);
          } catch (e) {
            Alert.alert(
              'Could not cancel request',
              errMessage(e, 'Please try again.'),
            );
            void refresh();
          }
        })();
      },
      acceptRequest: (userId) => {
        const requestId = incomingRequestByUser[userId];
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
        if (!requestId) {
          void refresh();
          return;
        }
        void (async () => {
          try {
            const connection = await connectionService.accept(requestId);
            if (connection.conversationId) {
              setConversationByPeer((prev) => ({
                ...prev,
                [userId]: connection.conversationId!,
              }));
            }
            // Conversation is created lazily on Message — no poll on accept.
          } catch (e) {
            Alert.alert(
              'Could not accept request',
              errMessage(e, 'Please try again.'),
            );
            void refresh();
          }
        })();
      },
      denyRequest: (userId) => {
        const requestId = incomingRequestByUser[userId];
        setIncomingUsers((prev) => prev.filter((u) => u.id !== userId));
        setIncomingRequestByUser((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        if (!requestId) return;
        void (async () => {
          try {
            await connectionService.reject(requestId);
          } catch (e) {
            Alert.alert(
              'Could not deny request',
              errMessage(e, 'Please try again.'),
            );
            void refresh();
          }
        })();
      },
      disconnect: (userId) => {
        setConnectedUsers((prev) => prev.filter((u) => u.id !== userId));
        setConversationByPeer((prev) => {
          const next = { ...prev };
          delete next[userId];
          return next;
        });
        void (async () => {
          try {
            await connectionService.disconnect(userId);
          } catch (e) {
            Alert.alert(
              'Could not disconnect',
              errMessage(e, 'Please try again.'),
            );
            void refresh();
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
    refresh,
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
