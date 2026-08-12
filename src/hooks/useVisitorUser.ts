import { useEffect, useState } from 'react';
import type { User } from '../data/types';
import { authApi, mapApiUserToUser } from '../services/authApi';

/**
 * Loads another user's public profile header from Nest (`GET /users/:id`).
 * Does not use mock identity.
 */
export function useVisitorUser(userId: string | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    (async () => {
      try {
        const apiUser = await authApi.getById(userId);
        if (cancelled) return;
        setUser(mapApiUserToUser(apiUser));
      } catch (err) {
        if (cancelled) return;
        setUser(null);
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { user, loading, error };
}
