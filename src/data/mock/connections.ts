import { User } from '../types';
import { users, currentUser } from './users';

export const connections: User[] = users.filter((u) => u.id !== currentUser.id);

export const getConnectionById = (id: string) => connections.find((u) => u.id === id);

/** Deterministic mock list of people connected to a given user (visitor profiles). */
export function getConnectionsForUser(userId: string): User[] {
  const pool = users.filter((u) => u.id !== userId);
  if (pool.length === 0) return [];

  // Rotate starting index from userId so different profiles show different sets
  let hash = 0;
  for (let i = 0; i < userId.length; i++) hash = (hash + userId.charCodeAt(i) * (i + 1)) % pool.length;
  const count = Math.min(4, pool.length);
  const result: User[] = [];
  for (let i = 0; i < count; i++) {
    result.push(pool[(hash + i) % pool.length]);
  }
  return result;
}
