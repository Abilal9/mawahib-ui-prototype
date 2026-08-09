import React, { createContext, useContext, useMemo, useState } from 'react';
import { User, ConnectionRelation } from '../data/types';
import { connectionService, userService } from '../services';

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

function selfId() {
  return userService.getCurrentSync().id;
}

function userById(id: string) {
  return userService.getByIdSync(id);
}

const SEED_CONNECTED = connectionService.getSeedConnectedIds();
const SEED_INCOMING = connectionService.getSeedIncomingIds(selfId(), SEED_CONNECTED);

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const [connectedIds, setConnectedIds] = useState<string[]>(SEED_CONNECTED);
  const [outgoingIds, setOutgoingIds] = useState<string[]>([]);
  const [incomingIds, setIncomingIds] = useState<string[]>(SEED_INCOMING);

  const value = useMemo<ConnectionsContextValue>(() => {
    const me = selfId();

    const getRelation = (userId: string): ConnectionRelation => {
      if (userId === me) return 'connected';
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
        if (userId === me) return;
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
  }, [connectedIds, outgoingIds, incomingIds]);

  return (
    <ConnectionsContext.Provider value={value}>{children}</ConnectionsContext.Provider>
  );
}

export function useConnections() {
  const ctx = useContext(ConnectionsContext);
  if (!ctx) throw new Error('useConnections must be used within ConnectionsProvider');
  return ctx;
}
