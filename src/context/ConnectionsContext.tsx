import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { User, ConnectionRelation } from '../data/types';
import { connectionService, userService } from '../services';
import { useAuth } from './AuthContext';

export type { ConnectionRelation };

interface ConnectionsContextValue {
  connectedIds: string[];
  outgoingIds: string[];
  incomingIds: string[];
  connectedUsers: User[];
  incomingUsers: User[];
  getRelation: (userId: string) => ConnectionRelation;
  isConnected: (userId: string) => boolean;
  requestConnect: (userId: string) => void;
  cancelOutgoing: (userId: string) => void;
  acceptRequest: (userId: string) => void;
  denyRequest: (userId: string) => void;
  disconnect: (userId: string) => void;
  /** Conversation id for a connected user, if one exists in mock inbox */
  getConversationId: (userId: string) => string | undefined;
}

const ConnectionsContext = createContext<ConnectionsContextValue | undefined>(undefined);

function userById(id: string) {
  return userService.getByIdSync(id);
}

const SEED_CONNECTED = connectionService.getSeedConnectedIds();

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const { mappedUser, apiUser, isSignedIn } = useAuth();
  const me = mappedUser?.id || apiUser?.id || '';

  const [connectedIds, setConnectedIds] = useState<string[]>(SEED_CONNECTED);
  const [outgoingIds, setOutgoingIds] = useState<string[]>([]);
  const [incomingIds, setIncomingIds] = useState<string[]>([]);

  useEffect(() => {
    if (!isSignedIn || !me) {
      setConnectedIds([]);
      setOutgoingIds([]);
      setIncomingIds([]);
      return;
    }
    setConnectedIds(SEED_CONNECTED);
    setOutgoingIds([]);
    setIncomingIds(connectionService.getSeedIncomingIds(me, SEED_CONNECTED));
  }, [isSignedIn, me]);

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
      connectedUsers: connectedIds
        .map(userById)
        .filter((u): u is User => !!u),
      incomingUsers: incomingIds
        .map(userById)
        .filter((u): u is User => !!u),
      getRelation,
      isConnected: (userId) => getRelation(userId) === 'connected',
      requestConnect: (userId) => {
        if (!me || userId === me) return;
        setConnectedIds((prev) => prev.filter((id) => id !== userId));
        setIncomingIds((prev) => prev.filter((id) => id !== userId));
        setOutgoingIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      },
      cancelOutgoing: (userId) => {
        setOutgoingIds((prev) => prev.filter((id) => id !== userId));
      },
      acceptRequest: (userId) => {
        setIncomingIds((prev) => prev.filter((id) => id !== userId));
        setOutgoingIds((prev) => prev.filter((id) => id !== userId));
        setConnectedIds((prev) => (prev.includes(userId) ? prev : [...prev, userId]));
      },
      denyRequest: (userId) => {
        setIncomingIds((prev) => prev.filter((id) => id !== userId));
      },
      disconnect: (userId) => {
        setConnectedIds((prev) => prev.filter((id) => id !== userId));
        setOutgoingIds((prev) => prev.filter((id) => id !== userId));
        setIncomingIds((prev) => prev.filter((id) => id !== userId));
      },
      getConversationId: (userId) => connectionService.getConversationId(userId),
    };
  }, [me, connectedIds, outgoingIds, incomingIds]);

  return (
    <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) throw new Error('useConnections must be used within ConnectionsProvider');
  return ctx;
}
