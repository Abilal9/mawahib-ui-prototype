import { useCallback, useRef } from 'react';
import { shouldIgnoreStaleIdentityResult } from '../context/identityGuard';
import { useAuth } from '../context/AuthContext';
import { accessTokenSubject } from '../lib/apiClient';

/**
 * Bumps a generation when the signed-in user or an optional scope (conversation
 * id) changes, so a late response cannot write into the next account or thread.
 */
export function useIdentityGeneration(scopeKey = '') {
  const { apiUser, accessToken, isSignedIn } = useAuth();
  const userId = apiUser?.id ?? null;
  const userIdRef = useRef(userId);
  const tokenRef = useRef(accessToken);
  const epochRef = useRef(0);
  const key = `${userId ?? ''}|${scopeKey}`;
  const boundRef = useRef(key);
  userIdRef.current = userId;
  tokenRef.current = accessToken;

  const identityChanged = boundRef.current !== key;
  if (identityChanged) {
    boundRef.current = key;
    epochRef.current += 1;
  }

  const snapshot = useCallback(
    () => ({
      userId: userIdRef.current,
      epoch: epochRef.current,
    }),
    [],
  );

  const isStale = useCallback(
    (startedUserId: string | null, epochAtStart: number) => {
      if (
        shouldIgnoreStaleIdentityResult({
          startedUserId,
          currentUserId: userIdRef.current,
          epochAtStart,
          epochNow: epochRef.current,
        })
      ) {
        return true;
      }
      const token = tokenRef.current;
      if (!token) return true;
      return accessTokenSubject(token) !== startedUserId;
    },
    [],
  );

  return {
    userId,
    isSignedIn,
    identityChanged,
    epoch: epochRef.current,
    snapshot,
    isStale,
  };
}
