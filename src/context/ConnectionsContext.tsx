import React, { createContext, useContext, useMemo, useState } from 'react';
import { User } from '../data/types';
import { users, currentUser } from '../data/mock/users';
import { conversations } from '../data/mock/messages';

export type ConnectionRelation = 'none' | 'outgoing' | 'incoming' | 'connected';

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
  return users.find((u) => u.id === id);
}

/** Seed: a couple of chat partners are already connected */
const SEED_CONNECTED = conversations.slice(0, 2).map((c) => c.participant.id);

/** Seed: pending incoming connection requests */
const SEED_INCOMING = users
  .filter((u) => u.id !== currentUser.id && !SEED_CONNECTED.includes(u.id))
  .slice(0, 3)
  .map((u) => u.id);

export function ConnectionsProvider({ children }: { children: React.ReactNode }) {
  const [connectedIds, setConnectedIds] = useState<string[]>(SEED_CONNECTED);
  const [outgoingIds, setOutgoingIds] = useState<string[]>([]);
  const [incomingIds, setIncomingIds] = useState<string[]>(SEED_INCOMING);

  const value = useMemo<ConnectionsContextValue>(() => {
    const getRelation = (userId: string): ConnectionRelation => {
      if (userId === currentUser.id) return 'connected';
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
        if (userId === currentUser.id) return;
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
      getConversationId: (userId) =>
        conversations.find((c) => c.participant.id === userId)?.id,
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
