import { useEffect, useState } from 'react';
import type { ProfileContent, User } from '../data/types';
import { emptyProfileContent } from '../context/ProfileContext';
import { authApi, mapApiUserToUser } from '../services/authApi';

/**
 * Loads another user's public profile header from Nest (`GET /users/:id`).
 * Includes structured about sections when present on the API user.
 */
export function useVisitorUser(userId: string | undefined) {
  const [user, setUser] = useState<User | null>(null);
  const [about, setAbout] = useState<ProfileContent>(emptyProfileContent());
  const [loading, setLoading] = useState(Boolean(userId));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!userId) {
      setUser(null);
      setAbout(emptyProfileContent());
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
        setAbout({
          ...emptyProfileContent(),
          bio: apiUser.bio ?? '',
          talents: apiUser.skills ?? [],
          languages: (apiUser.about?.languages ?? []).map((l) => ({
            ...l,
            flag: l.flag ?? '',
          })),
          education: apiUser.about?.education ?? [],
          experience: apiUser.about?.experience ?? [],
          certifications: apiUser.about?.certifications ?? [],
        });
      } catch (err) {
        if (cancelled) return;
        setUser(null);
        setAbout(emptyProfileContent());
        setError(err instanceof Error ? err.message : 'Failed to load user');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [userId]);

  return { user, about, loading, error };
}
