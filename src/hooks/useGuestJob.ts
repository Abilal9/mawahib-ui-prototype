import { useCallback, useEffect, useRef, useState } from 'react';
import { isBackendUserId } from '../lib/isBackendUserId';
import { isStaleIdentityError } from '../lib/identityFences';
import { isPublicNotFound, publicErrorMessage } from '../lib/publicErrors';
import { fetchPublicJob, type GuestJob } from '../services/publicApi';

export function useGuestJob(listingId: string | undefined) {
  const mounted = useRef(true);
  const gen = useRef(0);
  const valid = isBackendUserId(listingId);
  const [job, setJob] = useState<GuestJob | null>(null);
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
    if (!valid || !listingId) {
      setNotFound(true);
      setJob(null);
      setLoading(false);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    setNotFound(false);
    try {
      const next = await fetchPublicJob(listingId);
      if (requestGen !== gen.current || !mounted.current) return;
      setJob(next);
      setLoading(false);
    } catch (reason) {
      if (isStaleIdentityError(reason)) return;
      if (requestGen !== gen.current || !mounted.current) return;
      setJob(null);
      setLoading(false);
      setNotFound(isPublicNotFound(reason));
      setError(publicErrorMessage(reason));
    }
  }, [listingId, valid]);

  useEffect(() => {
    void load();
  }, [load]);

  return { job, loading, error, notFound, refresh: load };
}
