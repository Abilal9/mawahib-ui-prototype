import { useCallback, useEffect, useRef, useState } from 'react';
import { isBackendUserId } from '../lib/isBackendUserId';
import { isStaleIdentityError } from '../lib/identityFences';
import { isPublicNotFound, publicErrorMessage } from '../lib/publicErrors';
import { fetchPublicPost, type GuestPost } from '../services/publicApi';

export function useGuestPost(postId: string | undefined) {
  const mounted = useRef(true);
  const gen = useRef(0);
  const valid = isBackendUserId(postId);
  const [post, setPost] = useState<GuestPost | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [notFound, setNotFound] = useState(!valid);

  useEffect(() => {
    return () => {
      mounted.current = false;
    };
  }, []);

  const load = useCallback(async () => {
    const requestGen = ++gen.current;
    if (!valid || !postId) {
      setNotFound(true);
      setPost(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const next = await fetchPublicPost(postId);
      if (requestGen !== gen.current || !mounted.current) return;
      setPost(next);
      setLoading(false);
    } catch (reason) {
      if (isStaleIdentityError(reason)) return;
      if (requestGen !== gen.current || !mounted.current) return;
      setPost(null);
      setLoading(false);
      setNotFound(isPublicNotFound(reason));
      setError(publicErrorMessage(reason));
    }
  }, [postId, valid]);

  useEffect(() => {
    void load();
  }, [load]);

  return { post, loading, error, notFound, refresh: load };
}
